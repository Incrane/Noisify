-- Add match system columns to t_match_days
ALTER TABLE t_match_days 
ADD COLUMN IF NOT EXISTS matches jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS match_duration_seconds int DEFAULT 240,
ADD COLUMN IF NOT EXISTS current_match_index int DEFAULT NULL;

-- Add match tracking columns to t_match_events
ALTER TABLE t_match_events 
ADD COLUMN IF NOT EXISTS match_id text,
ADD COLUMN IF NOT EXISTS team_index int;

-- Function to generate matches after teams are created
CREATE OR REPLACE FUNCTION generate_matches_for_teams(p_match_day_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_day RECORD;
  v_teams JSONB;
  v_matches JSONB := '[]'::jsonb;
  v_num_teams INT;
  v_duration INT;
  i INT;
  j INT;
  v_match JSONB;
BEGIN
  -- Get match day
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Matchdagen finns inte');
  END IF;
  
  v_teams := v_match_day.generated_teams;
  v_num_teams := jsonb_array_length(v_teams);
  v_duration := COALESCE(v_match_day.match_duration_seconds, 240);
  
  IF v_num_teams < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Minst 2 lag krävs för att generera matcher');
  END IF;
  
  -- Generate round-robin matches (each team plays each other once)
  FOR i IN 0..(v_num_teams - 2) LOOP
    FOR j IN (i + 1)..(v_num_teams - 1) LOOP
      v_match := jsonb_build_object(
        'id', gen_random_uuid(),
        'team_a_index', i,
        'team_b_index', j,
        'status', 'pending',
        'score_a', 0,
        'score_b', 0,
        'time_remaining_seconds', v_duration,
        'is_paused', false,
        'started_at', null,
        'ended_at', null,
        'winner_team_index', null
      );
      v_matches := v_matches || v_match;
    END LOOP;
  END LOOP;
  
  -- Update match day with generated matches
  UPDATE t_match_days
  SET matches = v_matches,
      updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object(
    'success', true,
    'matches_count', jsonb_array_length(v_matches),
    'matches', v_matches
  );
END;
$$;

-- Function to start a match
CREATE OR REPLACE FUNCTION start_match(p_match_day_id UUID, p_match_index INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_day RECORD;
  v_matches JSONB;
  v_match JSONB;
BEGIN
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Matchdagen finns inte');
  END IF;
  
  -- Check if another match is in progress
  IF v_match_day.current_match_index IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'En annan match pågår redan');
  END IF;
  
  v_matches := v_match_day.matches;
  
  IF p_match_index >= jsonb_array_length(v_matches) THEN
    RETURN json_build_object('success', false, 'error', 'Ogiltig matchindex');
  END IF;
  
  v_match := v_matches->p_match_index;
  
  IF v_match->>'status' != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Matchen kan inte startas');
  END IF;
  
  -- Update match status
  v_match := jsonb_set(v_match, '{status}', '"in_progress"');
  v_match := jsonb_set(v_match, '{started_at}', to_jsonb(NOW()));
  v_match := jsonb_set(v_match, '{is_paused}', 'false');
  
  v_matches := jsonb_set(v_matches, ARRAY[p_match_index::text], v_match);
  
  UPDATE t_match_days
  SET matches = v_matches,
      current_match_index = p_match_index,
      status = 'in_progress',
      updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object('success', true, 'match', v_match);
END;
$$;

-- Function to pause/resume a match
CREATE OR REPLACE FUNCTION toggle_match_pause(p_match_day_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_day RECORD;
  v_matches JSONB;
  v_match JSONB;
  v_is_paused BOOLEAN;
  v_match_index INT;
BEGIN
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day.current_match_index IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ingen aktiv match');
  END IF;
  
  v_match_index := v_match_day.current_match_index;
  v_matches := v_match_day.matches;
  v_match := v_matches->v_match_index;
  v_is_paused := (v_match->>'is_paused')::boolean;
  
  -- Toggle pause state
  v_match := jsonb_set(v_match, '{is_paused}', to_jsonb(NOT v_is_paused));
  v_matches := jsonb_set(v_matches, ARRAY[v_match_index::text], v_match);
  
  UPDATE t_match_days
  SET matches = v_matches,
      updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object('success', true, 'is_paused', NOT v_is_paused);
END;
$$;

-- Function to update match timer
CREATE OR REPLACE FUNCTION update_match_timer(p_match_day_id UUID, p_time_remaining INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_day RECORD;
  v_matches JSONB;
  v_match JSONB;
  v_match_index INT;
BEGIN
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day.current_match_index IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ingen aktiv match');
  END IF;
  
  v_match_index := v_match_day.current_match_index;
  v_matches := v_match_day.matches;
  v_match := v_matches->v_match_index;
  
  v_match := jsonb_set(v_match, '{time_remaining_seconds}', to_jsonb(p_time_remaining));
  v_matches := jsonb_set(v_matches, ARRAY[v_match_index::text], v_match);
  
  UPDATE t_match_days
  SET matches = v_matches,
      updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Function to end a match and award win/loss points
CREATE OR REPLACE FUNCTION end_match(p_match_day_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_day RECORD;
  v_season RECORD;
  v_matches JSONB;
  v_match JSONB;
  v_match_index INT;
  v_teams JSONB;
  v_team_a JSONB;
  v_team_b JSONB;
  v_score_a INT;
  v_score_b INT;
  v_winner_index INT;
  v_win_points INT;
  v_loss_points INT;
  v_player_id UUID;
  v_player JSONB;
BEGIN
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day.current_match_index IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ingen aktiv match');
  END IF;
  
  -- Get season for point config
  SELECT * INTO v_season FROM t_seasons WHERE id = v_match_day.season_id;
  v_win_points := COALESCE((v_season.point_config->>'win')::int, 3);
  v_loss_points := COALESCE((v_season.point_config->>'loss')::int, 0);
  
  v_match_index := v_match_day.current_match_index;
  v_matches := v_match_day.matches;
  v_match := v_matches->v_match_index;
  v_teams := v_match_day.generated_teams;
  
  v_score_a := (v_match->>'score_a')::int;
  v_score_b := (v_match->>'score_b')::int;
  
  -- Determine winner
  IF v_score_a > v_score_b THEN
    v_winner_index := (v_match->>'team_a_index')::int;
  ELSIF v_score_b > v_score_a THEN
    v_winner_index := (v_match->>'team_b_index')::int;
  ELSE
    v_winner_index := NULL; -- Draw
  END IF;
  
  -- Update match status
  v_match := jsonb_set(v_match, '{status}', '"completed"');
  v_match := jsonb_set(v_match, '{ended_at}', to_jsonb(NOW()));
  v_match := jsonb_set(v_match, '{winner_team_index}', to_jsonb(v_winner_index));
  v_matches := jsonb_set(v_matches, ARRAY[v_match_index::text], v_match);
  
  -- Award win/loss points to players
  v_team_a := v_teams->((v_match->>'team_a_index')::int);
  v_team_b := v_teams->((v_match->>'team_b_index')::int);
  
  -- Team A players
  FOR v_player IN SELECT * FROM jsonb_array_elements(v_team_a->'players')
  LOOP
    v_player_id := (v_player)::text::uuid;
    IF v_winner_index = (v_match->>'team_a_index')::int THEN
      -- Team A won
      UPDATE t_player_stats 
      SET wins = wins + 1, 
          total_points = total_points + v_win_points,
          matches_played = matches_played + 1
      WHERE season_id = v_match_day.season_id AND profile_id = v_player_id;
    ELSIF v_winner_index IS NOT NULL THEN
      -- Team A lost
      UPDATE t_player_stats 
      SET losses = losses + 1, 
          total_points = total_points + v_loss_points,
          matches_played = matches_played + 1
      WHERE season_id = v_match_day.season_id AND profile_id = v_player_id;
    ELSE
      -- Draw
      UPDATE t_player_stats 
      SET matches_played = matches_played + 1
      WHERE season_id = v_match_day.season_id AND profile_id = v_player_id;
    END IF;
  END LOOP;
  
  -- Team B players
  FOR v_player IN SELECT * FROM jsonb_array_elements(v_team_b->'players')
  LOOP
    v_player_id := (v_player)::text::uuid;
    IF v_winner_index = (v_match->>'team_b_index')::int THEN
      -- Team B won
      UPDATE t_player_stats 
      SET wins = wins + 1, 
          total_points = total_points + v_win_points,
          matches_played = matches_played + 1
      WHERE season_id = v_match_day.season_id AND profile_id = v_player_id;
    ELSIF v_winner_index IS NOT NULL THEN
      -- Team B lost
      UPDATE t_player_stats 
      SET losses = losses + 1, 
          total_points = total_points + v_loss_points,
          matches_played = matches_played + 1
      WHERE season_id = v_match_day.season_id AND profile_id = v_player_id;
    ELSE
      -- Draw
      UPDATE t_player_stats 
      SET matches_played = matches_played + 1
      WHERE season_id = v_match_day.season_id AND profile_id = v_player_id;
    END IF;
  END LOOP;
  
  -- Clear current match and update
  UPDATE t_match_days
  SET matches = v_matches,
      current_match_index = NULL,
      updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object(
    'success', true, 
    'winner_team_index', v_winner_index,
    'score_a', v_score_a,
    'score_b', v_score_b
  );
END;
$$;

-- Function to record event during match (updates match score)
CREATE OR REPLACE FUNCTION record_match_event(
  p_match_day_id UUID,
  p_profile_id UUID,
  p_event_type TEXT,
  p_team_index INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_day RECORD;
  v_season RECORD;
  v_matches JSONB;
  v_match JSONB;
  v_match_index INT;
  v_match_id TEXT;
  v_points INT;
  v_score_field TEXT;
  v_current_score INT;
BEGIN
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day.current_match_index IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ingen aktiv match');
  END IF;
  
  -- Get point value from season config
  SELECT * INTO v_season FROM t_seasons WHERE id = v_match_day.season_id;
  v_points := COALESCE((v_season.point_config->>p_event_type)::int, 0);
  
  v_match_index := v_match_day.current_match_index;
  v_matches := v_match_day.matches;
  v_match := v_matches->v_match_index;
  v_match_id := v_match->>'id';
  
  -- Insert event
  INSERT INTO t_match_events (match_day_id, match_id, profile_id, event_type, points_awarded, team_index)
  VALUES (p_match_day_id, v_match_id, p_profile_id, p_event_type, v_points, p_team_index);
  
  -- Update player stats
  IF p_event_type = 'goal' THEN
    UPDATE t_player_stats 
    SET goals = goals + 1, total_points = total_points + v_points
    WHERE season_id = v_match_day.season_id AND profile_id = p_profile_id;
    
    -- Update match score
    IF p_team_index = (v_match->>'team_a_index')::int THEN
      v_current_score := (v_match->>'score_a')::int;
      v_match := jsonb_set(v_match, '{score_a}', to_jsonb(v_current_score + 1));
    ELSE
      v_current_score := (v_match->>'score_b')::int;
      v_match := jsonb_set(v_match, '{score_b}', to_jsonb(v_current_score + 1));
    END IF;
    
    v_matches := jsonb_set(v_matches, ARRAY[v_match_index::text], v_match);
    
    UPDATE t_match_days SET matches = v_matches, updated_at = NOW() WHERE id = p_match_day_id;
    
  ELSIF p_event_type = 'assist' THEN
    UPDATE t_player_stats 
    SET assists = assists + 1, total_points = total_points + v_points
    WHERE season_id = v_match_day.season_id AND profile_id = p_profile_id;
  ELSE
    -- Other event types
    UPDATE t_player_stats 
    SET total_points = total_points + v_points
    WHERE season_id = v_match_day.season_id AND profile_id = p_profile_id;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'points', v_points,
    'match', v_match
  );
END;
$$;

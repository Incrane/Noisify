-- =====================================================
-- Tournament System Migration
-- Created: 2025-12-10
-- Description: Creates tournament/league system with seasons,
--              player stats, match days, and match events.
--              All tables use t_ prefix to avoid collisions.
-- =====================================================

-- ===========================================
-- 1. CREATE t_seasons TABLE
-- ===========================================
-- Tournament seasons linked to organizations with configurable scoring and registration rules

CREATE TABLE IF NOT EXISTS t_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- SCORING ENGINE:
  -- Example: {"goal": 1, "assist": 2, "win": 12}
  point_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- REGISTRATION ENGINE:
  -- Example: {
  --   "method": "automatic",
  --   "access": "members_only",
  --   "min_age": 13,
  --   "max_age": 19,
  --   "allowed_genders": ["uuid1", "uuid2"],
  --   "allowed_groups": ["uuid1"]
  -- }
  registration_config JSONB NOT NULL DEFAULT '{"method": "manual"}'::jsonb,
  
  -- Dates
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Creator
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Index for organization lookup
CREATE INDEX IF NOT EXISTS t_seasons_org_idx ON t_seasons(organization_id);
CREATE INDEX IF NOT EXISTS t_seasons_active_idx ON t_seasons(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE t_seasons ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 2. CREATE t_player_stats TABLE
-- ===========================================
-- Player roster and statistics per season

CREATE TABLE IF NOT EXISTS t_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES t_seasons(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Statistics
  total_points INT DEFAULT 0,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  matches_played INT DEFAULT 0,
  
  -- Badges/achievements as JSONB array
  -- Example: [{"id": "top_scorer", "name": "Toppskansen", "awarded_at": "2025-01-01"}]
  badges JSONB DEFAULT '[]'::jsonb,
  
  -- Registration status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- One entry per player per season
  UNIQUE (season_id, profile_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS t_player_stats_season_idx ON t_player_stats(season_id);
CREATE INDEX IF NOT EXISTS t_player_stats_profile_idx ON t_player_stats(profile_id);
CREATE INDEX IF NOT EXISTS t_player_stats_points_idx ON t_player_stats(season_id, total_points DESC);

-- Enable RLS
ALTER TABLE t_player_stats ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 3. CREATE t_match_days TABLE
-- ===========================================
-- Individual match days with RSVP and team generation

CREATE TABLE IF NOT EXISTS t_match_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES t_seasons(id) ON DELETE CASCADE,
  
  -- Scheduling
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  
  -- Status workflow: open_for_rsvp -> rsvp_closed -> in_progress -> completed
  status TEXT DEFAULT 'open_for_rsvp' CHECK (status IN ('open_for_rsvp', 'rsvp_closed', 'in_progress', 'completed', 'cancelled')),
  
  -- RSVP tracking as JSONB object
  -- Example: {"uuid1": {"status": "attending", "checked_in": true}, "uuid2": {"status": "not_attending"}}
  rsvp_list JSONB DEFAULT '{}'::jsonb,
  
  -- Generated teams from snake draft
  -- Example: [{"name": "Lag 1", "captain": "uuid", "players": ["uuid1", "uuid2"]}, ...]
  generated_teams JSONB DEFAULT '[]'::jsonb,
  
  -- Match results summary
  results JSONB DEFAULT '{}'::jsonb,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS t_match_days_season_idx ON t_match_days(season_id);
CREATE INDEX IF NOT EXISTS t_match_days_date_idx ON t_match_days(date);
CREATE INDEX IF NOT EXISTS t_match_days_status_idx ON t_match_days(status);

-- Enable RLS
ALTER TABLE t_match_days ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 4. CREATE t_match_events TABLE
-- ===========================================
-- Individual scoring events during matches

CREATE TABLE IF NOT EXISTS t_match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_day_id UUID NOT NULL REFERENCES t_match_days(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Event type (matches keys in point_config: goal, assist, win, etc.)
  event_type TEXT NOT NULL,
  
  -- Points awarded (snapshot from point_config at time of event)
  points_awarded INT NOT NULL,
  
  -- Team reference (from generated_teams)
  team_id TEXT,
  
  -- Optional assisted_by for goals
  assisted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS t_match_events_match_day_idx ON t_match_events(match_day_id);
CREATE INDEX IF NOT EXISTS t_match_events_profile_idx ON t_match_events(profile_id);
CREATE INDEX IF NOT EXISTS t_match_events_type_idx ON t_match_events(event_type);

-- Enable RLS
ALTER TABLE t_match_events ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 5. RLS POLICIES FOR t_seasons
-- ===========================================

-- Public can view active seasons for public organizations
CREATE POLICY "Anyone can view active seasons"
  ON t_seasons FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR
    -- Staff can always see their org's seasons
    organization_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid()
    )
  );

-- Staff can create seasons for their organization
CREATE POLICY "Staff can create seasons"
  ON t_seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 2
    )
  );

-- Staff can update their organization's seasons
CREATE POLICY "Staff can update seasons"
  ON t_seasons FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 2
    )
  );

-- Higher staff can delete seasons
CREATE POLICY "Higher staff can delete seasons"
  ON t_seasons FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM org_user WHERE profile_id = auth.uid() AND role_id >= 3
    )
  );

-- ===========================================
-- 6. RLS POLICIES FOR t_player_stats
-- ===========================================

-- Anyone authenticated can view player stats (leaderboard is public)
CREATE POLICY "Anyone can view player stats"
  ON t_player_stats FOR SELECT
  TO authenticated
  USING (true);

-- Users can join seasons (insert their own stats) if eligible
CREATE POLICY "Users can join seasons"
  ON t_player_stats FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
    OR
    -- Staff can add players
    EXISTS (
      SELECT 1 FROM t_seasons s
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE s.id = season_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- Staff can update player stats
CREATE POLICY "Staff can update player stats"
  ON t_player_stats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM t_seasons s
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE s.id = season_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- Staff can remove players
CREATE POLICY "Staff can delete player stats"
  ON t_player_stats FOR DELETE
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM t_seasons s
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE s.id = season_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- ===========================================
-- 7. RLS POLICIES FOR t_match_days
-- ===========================================

-- Anyone can view match days for seasons they can see
CREATE POLICY "Anyone can view match days"
  ON t_match_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM t_seasons s
      WHERE s.id = season_id
      AND (
        s.is_active = true
        OR s.organization_id IN (
          SELECT org_id FROM org_user WHERE profile_id = auth.uid()
        )
      )
    )
  );

-- Staff can create match days
CREATE POLICY "Staff can create match days"
  ON t_match_days FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM t_seasons s
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE s.id = season_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- Staff can update match days
CREATE POLICY "Staff can update match days"
  ON t_match_days FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM t_seasons s
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE s.id = season_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- Higher staff can delete match days
CREATE POLICY "Higher staff can delete match days"
  ON t_match_days FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM t_seasons s
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE s.id = season_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 3
    )
  );

-- ===========================================
-- 8. RLS POLICIES FOR t_match_events
-- ===========================================

-- Anyone can view match events
CREATE POLICY "Anyone can view match events"
  ON t_match_events FOR SELECT
  TO authenticated
  USING (true);

-- Staff can record events
CREATE POLICY "Staff can create match events"
  ON t_match_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM t_match_days md
      JOIN t_seasons s ON s.id = md.season_id
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE md.id = match_day_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- Staff can update events (corrections)
CREATE POLICY "Staff can update match events"
  ON t_match_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM t_match_days md
      JOIN t_seasons s ON s.id = md.season_id
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE md.id = match_day_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- Staff can delete events (undo)
CREATE POLICY "Staff can delete match events"
  ON t_match_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM t_match_days md
      JOIN t_seasons s ON s.id = md.season_id
      JOIN org_user ou ON ou.org_id = s.organization_id
      WHERE md.id = match_day_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 2
    )
  );

-- ===========================================
-- 9. HELPER VIEWS
-- ===========================================

-- Leaderboard view for a season
CREATE OR REPLACE VIEW t_leaderboard AS
SELECT 
  ps.id,
  ps.season_id,
  ps.profile_id,
  p.alias,
  p.image_url,
  ps.total_points,
  ps.goals,
  ps.assists,
  ps.wins,
  ps.losses,
  ps.matches_played,
  ps.badges,
  ps.status,
  ps.joined_at,
  RANK() OVER (PARTITION BY ps.season_id ORDER BY ps.total_points DESC, ps.goals DESC) as rank,
  s.name as season_name,
  s.organization_id,
  o.org_namn as organization_name
FROM t_player_stats ps
JOIN profiles p ON p.id = ps.profile_id
JOIN t_seasons s ON s.id = ps.season_id
JOIN organizations o ON o.id = s.organization_id
WHERE ps.status = 'active';

-- Season dashboard view
CREATE OR REPLACE VIEW t_season_dashboard AS
SELECT 
  s.id as season_id,
  s.name,
  s.description,
  s.is_active,
  s.point_config,
  s.registration_config,
  s.starts_at,
  s.ends_at,
  s.organization_id,
  o.org_namn as organization_name,
  o.slug as organization_slug,
  s.created_at,
  s.created_by,
  p.alias as created_by_alias,
  -- Stats
  (SELECT COUNT(*) FROM t_player_stats ps WHERE ps.season_id = s.id AND ps.status = 'active') as player_count,
  (SELECT COUNT(*) FROM t_match_days md WHERE md.season_id = s.id) as total_match_days,
  (SELECT COUNT(*) FROM t_match_days md WHERE md.season_id = s.id AND md.status = 'completed') as completed_match_days,
  (SELECT MAX(date) FROM t_match_days md WHERE md.season_id = s.id AND md.status = 'open_for_rsvp') as next_match_day
FROM t_seasons s
JOIN organizations o ON o.id = s.organization_id
LEFT JOIN profiles p ON p.id = s.created_by;

-- Match day detail view
CREATE OR REPLACE VIEW t_match_day_detail AS
SELECT 
  md.id as match_day_id,
  md.season_id,
  md.date,
  md.location,
  md.status,
  md.rsvp_list,
  md.generated_teams,
  md.results,
  md.notes,
  md.created_at,
  md.created_by,
  s.name as season_name,
  s.point_config,
  s.organization_id,
  -- RSVP counts
  (SELECT COUNT(*) FROM jsonb_each(md.rsvp_list) WHERE value->>'status' = 'attending') as attending_count,
  (SELECT COUNT(*) FROM jsonb_each(md.rsvp_list) WHERE value->>'status' = 'not_attending') as not_attending_count,
  (SELECT COUNT(*) FROM jsonb_each(md.rsvp_list) WHERE value->>'checked_in' = 'true') as checked_in_count,
  -- Event counts
  (SELECT COUNT(*) FROM t_match_events me WHERE me.match_day_id = md.id) as total_events
FROM t_match_days md
JOIN t_seasons s ON s.id = md.season_id;

-- ===========================================
-- 10. RPC FUNCTIONS
-- ===========================================

-- Function to join a tournament season
CREATE OR REPLACE FUNCTION join_tournament_season(p_season_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_season RECORD;
  v_config JSONB;
  v_user_age INT;
  v_user_gender UUID;
  v_is_member BOOLEAN;
  v_existing RECORD;
  v_result UUID;
BEGIN
  -- Get current user profile
  v_profile_id := auth.uid();
  
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Du måste vara inloggad');
  END IF;
  
  -- Get season details
  SELECT * INTO v_season FROM t_seasons WHERE id = p_season_id AND is_active = true;
  
  IF v_season IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Säsongen finns inte eller är inaktiv');
  END IF;
  
  -- Check if already registered
  SELECT * INTO v_existing FROM t_player_stats WHERE season_id = p_season_id AND profile_id = v_profile_id;
  
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Du är redan registrerad i denna säsong');
  END IF;
  
  v_config := v_season.registration_config;
  
  -- Check registration method
  IF v_config->>'method' = 'manual' THEN
    RETURN json_build_object('success', false, 'error', 'Denna turnering kräver manuell registrering. Kontakta personalen.');
  END IF;
  
  -- Get user details for validation
  SELECT 
    EXTRACT(YEAR FROM age(NOW(), up.birth_date))::INT,
    up.gender_id
  INTO v_user_age, v_user_gender
  FROM users_private up
  WHERE up.profile_id = v_profile_id;
  
  -- Check membership if required
  IF v_config->>'access' = 'members_only' THEN
    SELECT EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.profile_id = v_profile_id 
      AND m.org_id = v_season.organization_id 
      AND m.membership_state = 'active'
    ) INTO v_is_member;
    
    IF NOT v_is_member THEN
      RETURN json_build_object('success', false, 'error', 'Du måste vara medlem för att gå med i denna turnering');
    END IF;
  END IF;
  
  -- Check age limits
  IF v_config->>'min_age' IS NOT NULL AND v_user_age < (v_config->>'min_age')::INT THEN
    RETURN json_build_object('success', false, 'error', 'Du uppfyller inte minimiåldern för denna turnering');
  END IF;
  
  IF v_config->>'max_age' IS NOT NULL AND v_user_age > (v_config->>'max_age')::INT THEN
    RETURN json_build_object('success', false, 'error', 'Du överstiger maxåldern för denna turnering');
  END IF;
  
  -- Check gender restrictions
  IF v_config->'allowed_genders' IS NOT NULL AND jsonb_array_length(v_config->'allowed_genders') > 0 THEN
    IF NOT (v_config->'allowed_genders' ? v_user_gender::TEXT) THEN
      RETURN json_build_object('success', false, 'error', 'Denna turnering är begränsad till specifika grupper');
    END IF;
  END IF;
  
  -- All checks passed, create player stats entry
  INSERT INTO t_player_stats (season_id, profile_id)
  VALUES (p_season_id, v_profile_id)
  RETURNING id INTO v_result;
  
  RETURN json_build_object('success', true, 'message', 'Du har gått med i turneringen!', 'player_stats_id', v_result);
END;
$$;

-- Function to record a match event (goal, assist, etc.)
CREATE OR REPLACE FUNCTION record_match_event(
  p_match_day_id UUID,
  p_profile_id UUID,
  p_event_type TEXT,
  p_team_id TEXT DEFAULT NULL,
  p_assisted_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recorder_id UUID;
  v_match_day RECORD;
  v_season RECORD;
  v_points INT;
  v_event_id UUID;
BEGIN
  v_recorder_id := auth.uid();
  
  -- Get match day and season
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Matchdagen finns inte');
  END IF;
  
  IF v_match_day.status != 'in_progress' THEN
    RETURN json_build_object('success', false, 'error', 'Matchen är inte aktiv');
  END IF;
  
  SELECT * INTO v_season FROM t_seasons WHERE id = v_match_day.season_id;
  
  -- Get points from point_config
  v_points := COALESCE((v_season.point_config->>p_event_type)::INT, 0);
  
  IF v_points = 0 AND p_event_type NOT IN ('win', 'loss') THEN
    RETURN json_build_object('success', false, 'error', 'Okänd händelsetyp: ' || p_event_type);
  END IF;
  
  -- Insert event
  INSERT INTO t_match_events (match_day_id, profile_id, event_type, points_awarded, team_id, assisted_by, recorded_by)
  VALUES (p_match_day_id, p_profile_id, p_event_type, v_points, p_team_id, p_assisted_by, v_recorder_id)
  RETURNING id INTO v_event_id;
  
  -- Update player stats
  UPDATE t_player_stats
  SET 
    total_points = total_points + v_points,
    goals = goals + CASE WHEN p_event_type = 'goal' THEN 1 ELSE 0 END,
    assists = assists + CASE WHEN p_event_type = 'assist' THEN 1 ELSE 0 END,
    wins = wins + CASE WHEN p_event_type = 'win' THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN p_event_type = 'loss' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE season_id = v_match_day.season_id AND profile_id = p_profile_id;
  
  -- If assist was recorded, also update assister's stats
  IF p_assisted_by IS NOT NULL AND p_event_type = 'goal' THEN
    DECLARE
      v_assist_points INT;
    BEGIN
      v_assist_points := COALESCE((v_season.point_config->>'assist')::INT, 0);
      
      -- Insert assist event
      INSERT INTO t_match_events (match_day_id, profile_id, event_type, points_awarded, team_id, recorded_by)
      VALUES (p_match_day_id, p_assisted_by, 'assist', v_assist_points, p_team_id, v_recorder_id);
      
      -- Update assister stats
      UPDATE t_player_stats
      SET 
        total_points = total_points + v_assist_points,
        assists = assists + 1,
        updated_at = NOW()
      WHERE season_id = v_match_day.season_id AND profile_id = p_assisted_by;
    END;
  END IF;
  
  RETURN json_build_object('success', true, 'event_id', v_event_id, 'points', v_points);
END;
$$;

-- Function to undo last match event
CREATE OR REPLACE FUNCTION undo_match_event(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event RECORD;
  v_match_day RECORD;
BEGIN
  -- Get the event
  SELECT * INTO v_event FROM t_match_events WHERE id = p_event_id;
  
  IF v_event IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Händelsen finns inte');
  END IF;
  
  -- Get match day
  SELECT * INTO v_match_day FROM t_match_days WHERE id = v_event.match_day_id;
  
  -- Revert player stats
  UPDATE t_player_stats
  SET 
    total_points = total_points - v_event.points_awarded,
    goals = goals - CASE WHEN v_event.event_type = 'goal' THEN 1 ELSE 0 END,
    assists = assists - CASE WHEN v_event.event_type = 'assist' THEN 1 ELSE 0 END,
    wins = wins - CASE WHEN v_event.event_type = 'win' THEN 1 ELSE 0 END,
    losses = losses - CASE WHEN v_event.event_type = 'loss' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE season_id = v_match_day.season_id AND profile_id = v_event.profile_id;
  
  -- Delete the event
  DELETE FROM t_match_events WHERE id = p_event_id;
  
  RETURN json_build_object('success', true, 'message', 'Händelsen har ångrats');
END;
$$;

-- Function to update RSVP status
CREATE OR REPLACE FUNCTION update_match_rsvp(
  p_match_day_id UUID,
  p_status TEXT -- 'attending' or 'not_attending'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_match_day RECORD;
BEGIN
  v_profile_id := auth.uid();
  
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Du måste vara inloggad');
  END IF;
  
  -- Get match day
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Matchdagen finns inte');
  END IF;
  
  IF v_match_day.status != 'open_for_rsvp' THEN
    RETURN json_build_object('success', false, 'error', 'Närvaro kan inte längre ändras');
  END IF;
  
  -- Check if user is registered in the season
  IF NOT EXISTS (
    SELECT 1 FROM t_player_stats 
    WHERE season_id = v_match_day.season_id 
    AND profile_id = v_profile_id 
    AND status = 'active'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Du är inte registrerad i denna säsong');
  END IF;
  
  -- Update RSVP
  UPDATE t_match_days
  SET rsvp_list = jsonb_set(
    COALESCE(rsvp_list, '{}'::jsonb),
    ARRAY[v_profile_id::TEXT],
    jsonb_build_object('status', p_status, 'updated_at', NOW())
  ),
  updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object('success', true, 'message', CASE WHEN p_status = 'attending' THEN 'Du har anmält dig!' ELSE 'Du har avanmält dig' END);
END;
$$;

-- Function to check in a player (staff only)
CREATE OR REPLACE FUNCTION check_in_player(
  p_match_day_id UUID,
  p_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE t_match_days
  SET rsvp_list = jsonb_set(
    COALESCE(rsvp_list, '{}'::jsonb),
    ARRAY[p_profile_id::TEXT],
    COALESCE(rsvp_list->p_profile_id::TEXT, '{}'::jsonb) || jsonb_build_object('checked_in', true, 'checked_in_at', NOW())
  ),
  updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object('success', true, 'message', 'Spelare incheckad');
END;
$$;

-- Function to generate teams using snake draft
CREATE OR REPLACE FUNCTION generate_snake_draft_teams(
  p_match_day_id UUID,
  p_num_teams INT DEFAULT 4
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_match_day RECORD;
  v_checked_in_players JSONB[];
  v_sorted_players JSONB[];
  v_teams JSONB;
  v_player JSONB;
  v_team_idx INT;
  v_direction INT;
  i INT;
BEGIN
  -- Get match day
  SELECT * INTO v_match_day FROM t_match_days WHERE id = p_match_day_id;
  
  IF v_match_day IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Matchdagen finns inte');
  END IF;
  
  -- Get checked-in players sorted by total_points
  SELECT ARRAY_AGG(
    jsonb_build_object(
      'profile_id', ps.profile_id,
      'alias', p.alias,
      'total_points', ps.total_points
    ) ORDER BY ps.total_points DESC
  )
  INTO v_sorted_players
  FROM t_player_stats ps
  JOIN profiles p ON p.id = ps.profile_id
  WHERE ps.season_id = v_match_day.season_id
  AND v_match_day.rsvp_list->ps.profile_id::TEXT->>'checked_in' = 'true';
  
  IF v_sorted_players IS NULL OR array_length(v_sorted_players, 1) < p_num_teams THEN
    RETURN json_build_object('success', false, 'error', 'Inte tillräckligt med incheckade spelare');
  END IF;
  
  -- Initialize teams with captains (top N players)
  v_teams := '[]'::jsonb;
  FOR i IN 1..p_num_teams LOOP
    v_teams := v_teams || jsonb_build_object(
      'id', 'team_' || i,
      'name', 'Lag ' || i,
      'captain', v_sorted_players[i]->>'profile_id',
      'players', jsonb_build_array(v_sorted_players[i]->>'profile_id')
    );
  END LOOP;
  
  -- Snake draft remaining players
  v_team_idx := 1;
  v_direction := 1;
  
  FOR i IN (p_num_teams + 1)..array_length(v_sorted_players, 1) LOOP
    -- Add player to current team
    v_teams := jsonb_set(
      v_teams,
      ARRAY[(v_team_idx - 1)::TEXT, 'players'],
      (v_teams->(v_team_idx - 1)->'players') || to_jsonb(v_sorted_players[i]->>'profile_id')
    );
    
    -- Snake: move to next team or reverse direction
    v_team_idx := v_team_idx + v_direction;
    
    IF v_team_idx > p_num_teams THEN
      v_team_idx := p_num_teams;
      v_direction := -1;
    ELSIF v_team_idx < 1 THEN
      v_team_idx := 1;
      v_direction := 1;
    END IF;
  END LOOP;
  
  -- Save generated teams
  UPDATE t_match_days
  SET generated_teams = v_teams, updated_at = NOW()
  WHERE id = p_match_day_id;
  
  RETURN json_build_object('success', true, 'teams', v_teams);
END;
$$;

-- Function to get user's tournament eligibility
CREATE OR REPLACE FUNCTION check_tournament_eligibility(p_season_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id UUID;
  v_season RECORD;
  v_config JSONB;
  v_user_age INT;
  v_user_gender UUID;
  v_is_member BOOLEAN;
  v_is_registered BOOLEAN;
  v_errors TEXT[] := '{}';
BEGIN
  v_profile_id := auth.uid();
  
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('eligible', false, 'reason', 'not_logged_in', 'message', 'Du måste vara inloggad');
  END IF;
  
  -- Get season
  SELECT * INTO v_season FROM t_seasons WHERE id = p_season_id;
  
  IF v_season IS NULL OR NOT v_season.is_active THEN
    RETURN json_build_object('eligible', false, 'reason', 'season_inactive', 'message', 'Säsongen är inte aktiv');
  END IF;
  
  -- Check if already registered
  SELECT EXISTS (
    SELECT 1 FROM t_player_stats WHERE season_id = p_season_id AND profile_id = v_profile_id
  ) INTO v_is_registered;
  
  IF v_is_registered THEN
    RETURN json_build_object('eligible', false, 'reason', 'already_registered', 'message', 'Du är redan registrerad');
  END IF;
  
  v_config := v_season.registration_config;
  
  -- Check manual registration
  IF v_config->>'method' = 'manual' THEN
    RETURN json_build_object('eligible', false, 'reason', 'manual_only', 'message', 'Kontakta personalen för att gå med');
  END IF;
  
  -- Get user details
  SELECT 
    EXTRACT(YEAR FROM age(NOW(), up.birth_date))::INT,
    up.gender_id
  INTO v_user_age, v_user_gender
  FROM users_private up
  WHERE up.profile_id = v_profile_id;
  
  -- Check membership
  IF v_config->>'access' = 'members_only' THEN
    SELECT EXISTS (
      SELECT 1 FROM memberships m 
      WHERE m.profile_id = v_profile_id 
      AND m.org_id = v_season.organization_id 
      AND m.membership_state = 'active'
    ) INTO v_is_member;
    
    IF NOT v_is_member THEN
      v_errors := array_append(v_errors, 'Du måste vara medlem');
    END IF;
  END IF;
  
  -- Check age
  IF v_config->>'min_age' IS NOT NULL AND v_user_age < (v_config->>'min_age')::INT THEN
    v_errors := array_append(v_errors, 'Du uppfyller inte minimiåldern (' || (v_config->>'min_age') || ' år)');
  END IF;
  
  IF v_config->>'max_age' IS NOT NULL AND v_user_age > (v_config->>'max_age')::INT THEN
    v_errors := array_append(v_errors, 'Du överstiger maxåldern (' || (v_config->>'max_age') || ' år)');
  END IF;
  
  -- Check gender
  IF v_config->'allowed_genders' IS NOT NULL AND jsonb_array_length(v_config->'allowed_genders') > 0 THEN
    IF NOT (v_config->'allowed_genders' ? v_user_gender::TEXT) THEN
      v_errors := array_append(v_errors, 'Turneringen är begränsad till specifika grupper');
    END IF;
  END IF;
  
  IF array_length(v_errors, 1) > 0 THEN
    RETURN json_build_object('eligible', false, 'reason', 'validation_failed', 'errors', v_errors);
  END IF;
  
  RETURN json_build_object('eligible', true, 'message', 'Du kan gå med i denna turnering');
END;
$$;

-- ===========================================
-- 11. TRIGGERS FOR updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION update_tournament_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_seasons_updated_at
  BEFORE UPDATE ON t_seasons
  FOR EACH ROW EXECUTE FUNCTION update_tournament_timestamp();

CREATE TRIGGER t_player_stats_updated_at
  BEFORE UPDATE ON t_player_stats
  FOR EACH ROW EXECUTE FUNCTION update_tournament_timestamp();

CREATE TRIGGER t_match_days_updated_at
  BEFORE UPDATE ON t_match_days
  FOR EACH ROW EXECUTE FUNCTION update_tournament_timestamp();

-- ===========================================
-- 12. ENABLE REALTIME
-- ===========================================

-- Enable realtime for live scoring
ALTER PUBLICATION supabase_realtime ADD TABLE t_match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE t_player_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE t_match_days;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

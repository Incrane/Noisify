-- Update get_season_leaderboard to include real names for staff
CREATE OR REPLACE FUNCTION get_season_leaderboard(p_season_id UUID)
RETURNS TABLE (
  rank BIGINT,
  profile_id UUID,
  alias TEXT,
  image_url TEXT,
  first_name TEXT,
  last_name TEXT,
  total_points INT,
  goals INT,
  assists INT,
  wins INT,
  losses INT,
  matches_played INT,
  status TEXT,
  is_staff_viewer BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
  v_has_access BOOLEAN := FALSE;
  v_is_staff BOOLEAN := FALSE;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = v_user_id;
  
  -- Check if user is staff of organization (try both user_id and profile_id for compatibility)
  IF EXISTS (
    SELECT 1 FROM org_user ou
    JOIN t_seasons s ON s.organization_id = ou.org_id
    WHERE s.id = p_season_id
    AND (ou.user_id = v_user_id OR ou.profile_id = v_profile_id)
    AND ou.role_id >= 1
  ) THEN
    v_has_access := TRUE;
    v_is_staff := TRUE;
  END IF;
  
  -- Check if user is registered in the season
  IF NOT v_has_access AND EXISTS (
    SELECT 1 FROM t_player_stats 
    WHERE season_id = p_season_id 
    AND profile_id = v_profile_id
  ) THEN
    v_has_access := TRUE;
  END IF;
  
  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Du måste vara registrerad i turneringen för att se tabellen';
  END IF;
  
  -- Return leaderboard with names visible only for staff
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ps.total_points DESC, ps.goals DESC) as rank,
    ps.profile_id,
    p.alias,
    p.image_url,
    CASE WHEN v_is_staff THEN up.first_name ELSE NULL END as first_name,
    CASE WHEN v_is_staff THEN up.last_name ELSE NULL END as last_name,
    ps.total_points,
    ps.goals,
    ps.assists,
    ps.wins,
    ps.losses,
    ps.matches_played,
    ps.status,
    v_is_staff as is_staff_viewer
  FROM t_player_stats ps
  JOIN profiles p ON p.id = ps.profile_id
  LEFT JOIN users_private up ON up.profile_id = ps.profile_id
  WHERE ps.season_id = p_season_id
  AND ps.status = 'active'
  ORDER BY ps.total_points DESC, ps.goals DESC;
END;
$$;

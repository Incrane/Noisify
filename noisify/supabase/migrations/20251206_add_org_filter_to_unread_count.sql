CREATE OR REPLACE FUNCTION public.get_unread_chat_count(p_org_id uuid DEFAULT NULL)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_count INTEGER;
  v_profile_id uuid;
BEGIN
  -- Get current user's profile id
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = auth.uid();
  
  SELECT COUNT(DISTINCT cm.group_id)
  INTO v_count
  FROM chat_messages cm
  JOIN chat_participants cp ON cm.group_id = cp.group_id
  LEFT JOIN chat_groups cg ON cm.group_id = cg.id
  WHERE cp.profile_id = v_profile_id
  AND cm.created_at > cp.last_read_at
  AND cm.sender_id != v_profile_id
  AND (p_org_id IS NULL OR cg.org_id = p_org_id);
  
  RETURN v_count;
END;
$function$

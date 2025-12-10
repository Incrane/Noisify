CREATE OR REPLACE FUNCTION public.get_unread_chat_count()
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
  WHERE cp.profile_id = v_profile_id
  AND cm.created_at > cp.last_read_at
  AND cm.sender_id != v_profile_id; -- Don't count my own messages
  
  RETURN v_count;
END;
$function$

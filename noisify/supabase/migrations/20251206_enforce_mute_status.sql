CREATE OR REPLACE FUNCTION check_mute_status_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_sender_profile_id UUID;
    v_muted_until TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get org_id from the chat group
    SELECT org_id INTO v_org_id
    FROM chat_groups
    WHERE id = NEW.group_id;

    -- Get the sender's profile_id (assuming sender_id in chat_messages is profile_id)
    v_sender_profile_id := NEW.sender_id;

    -- Check if the user is a member of the organization and get muted_until
    SELECT muted_until INTO v_muted_until
    FROM memberships
    WHERE org_id = v_org_id AND profile_id = v_sender_profile_id;

    -- If user is muted and time hasn't passed, raise exception
    IF v_muted_until IS NOT NULL AND v_muted_until > NOW() THEN
        RAISE EXCEPTION 'User is muted until %', v_muted_until;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop trigger if exists to allow idempotent runs
DROP TRIGGER IF EXISTS tr_check_mute_status_on_message ON chat_messages;

CREATE TRIGGER tr_check_mute_status_on_message
BEFORE INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION check_mute_status_on_message();

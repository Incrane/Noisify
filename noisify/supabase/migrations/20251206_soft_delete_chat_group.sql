CREATE OR REPLACE FUNCTION soft_delete_chat_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_user_role INT;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get organization ID of the group
    SELECT org_id INTO v_org_id
    FROM chat_groups
    WHERE id = p_group_id;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Group not found';
    END IF;

    -- Check if user is staff in the organization (role >= 1)
    SELECT role_id INTO v_user_role
    FROM org_user
    WHERE org_id = v_org_id AND user_id = auth.uid();

    IF v_user_role IS NULL OR v_user_role < 1 THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Update the group
    UPDATE chat_groups
    SET is_active = false
    WHERE id = p_group_id;
END;
$$;

-- Drop the too-strict policy
DROP POLICY "Select chat_groups" ON chat_groups;

-- Create permission policy: Participants OR Creator can see the group
-- This is necessary because when creating a group, the creator is not yet a participant
-- but needs to see the returned group ID to add participants.
CREATE POLICY "Select chat_groups" ON chat_groups
FOR SELECT
USING (
  is_chat_participant(id) OR
  created_by IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);

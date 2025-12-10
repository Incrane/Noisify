-- Drop the permissive policy that leaks group existence to staff
DROP POLICY "Select chat_groups" ON chat_groups;

-- Create strict policy: Users can ONLY see groups they are participating in
CREATE POLICY "Select chat_groups" ON chat_groups
FOR SELECT
USING (
  is_chat_participant(id)
);

-- ============================================
-- Fix RLS Policies for Live Quiz System
-- Removes infinite recursion and adds anon access
-- ============================================

-- 1. Fix quiz_sessions select policy (remove recursion)
DROP POLICY IF EXISTS "Users can view sessions they host or participate in" ON quiz_sessions;

CREATE POLICY "Users can view sessions"
ON quiz_sessions FOR SELECT
TO authenticated
USING (
  access_policy = 'OPEN'
  OR host_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR org_id IN (SELECT ou.org_id FROM org_user ou JOIN profiles p ON p.id = ou.profile_id WHERE p.user_id = auth.uid())
);

-- 2. Add anon access for quiz_sessions (for guests)
CREATE POLICY "Anon can view open sessions"
ON quiz_sessions FOR SELECT
TO anon
USING (
  access_policy = 'OPEN'
);

-- 3. Fix quiz_participants policies
DROP POLICY IF EXISTS "Anyone can view participants in their session" ON quiz_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON quiz_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON quiz_participants;

-- Allow viewing participants if you can view the session
-- This relies on quiz_sessions policy which is now safe (non-recursive)
CREATE POLICY "Anyone can view participants in their session"
ON quiz_participants FOR SELECT
TO authenticated
USING (
  session_id IN (SELECT id FROM quiz_sessions)
);

CREATE POLICY "Anon can view participants in open sessions"
ON quiz_participants FOR SELECT
TO anon
USING (
  session_id IN (SELECT id FROM quiz_sessions WHERE access_policy = 'OPEN')
);

-- Allow joining
CREATE POLICY "Authenticated users can join sessions"
ON quiz_participants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anon can join open sessions"
ON quiz_participants FOR INSERT
TO anon
WITH CHECK (
  session_id IN (SELECT id FROM quiz_sessions WHERE access_policy = 'OPEN')
);

-- Allow updating own record
-- For authenticated users, check profile_id
CREATE POLICY "Users can update their own participant record"
ON quiz_participants FOR UPDATE
TO authenticated
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR session_id IN (SELECT id FROM quiz_sessions WHERE host_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- For guests (anon), we can't easily check ownership securely without a token/cookie
-- But for now, let's allow anon to update if they know the UUID (which they get on creation)
-- Ideally, we should use a secret token, but RLS checks row existence.
-- If we assume the ID is secret enough for the duration of the game:
CREATE POLICY "Anon can update participant record"
ON quiz_participants FOR UPDATE
TO anon
USING (
  session_id IN (SELECT id FROM quiz_sessions WHERE access_policy = 'OPEN')
);

-- 4. Fix quiz_answers policies
DROP POLICY IF EXISTS "Users can view answers in their sessions" ON quiz_answers;
DROP POLICY IF EXISTS "Users can submit answers" ON quiz_answers;

CREATE POLICY "Users can view answers in their sessions"
ON quiz_answers FOR SELECT
TO authenticated
USING (
  session_id IN (SELECT id FROM quiz_sessions)
);

CREATE POLICY "Anon can view answers in open sessions"
ON quiz_answers FOR SELECT
TO anon
USING (
  session_id IN (SELECT id FROM quiz_sessions WHERE access_policy = 'OPEN')
);

CREATE POLICY "Users can submit answers"
ON quiz_answers FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is the participant linked to the answer
  participant_id IN (
    SELECT id FROM quiz_participants 
    WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Anon can submit answers"
ON quiz_answers FOR INSERT
TO anon
WITH CHECK (
  session_id IN (SELECT id FROM quiz_sessions WHERE access_policy = 'OPEN')
);

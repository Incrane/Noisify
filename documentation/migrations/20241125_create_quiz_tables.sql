-- ============================================
-- Live Quiz System Tables Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Allmänt',
  is_public BOOLEAN NOT NULL DEFAULT false,
  cloned_from UUID REFERENCES quizzes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  time_limit_seconds INTEGER NOT NULL DEFAULT 20,
  order_index INTEGER NOT NULL DEFAULT 0,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id),
  pin_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'LOBBY',
  access_policy TEXT NOT NULL DEFAULT 'ORG_ONLY',
  current_question_index INTEGER NOT NULL DEFAULT -1,
  current_state TEXT NOT NULL DEFAULT 'WAITING_FOR_HOST',
  question_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 4. Create quiz_participants table
CREATE TABLE IF NOT EXISTS quiz_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  guest_name TEXT,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_answer_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create quiz_answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES quiz_participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_taken_ms INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, participant_id, question_index)
);

-- ============================================
-- Enable Row Level Security
-- ============================================

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for quizzes
-- ============================================

CREATE POLICY "Users can view quizzes from their org or public"
ON quizzes FOR SELECT
TO authenticated
USING (
  is_public = true
  OR org_id IN (
    SELECT ou.org_id FROM org_user ou
    JOIN profiles p ON p.id = ou.profile_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can create quizzes for their org"
ON quizzes FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT ou.org_id FROM org_user ou
    JOIN profiles p ON p.id = ou.profile_id
    WHERE p.user_id = auth.uid() AND ou.role_id >= 2
  )
);

CREATE POLICY "Staff can update their org's quizzes"
ON quizzes FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT ou.org_id FROM org_user ou
    JOIN profiles p ON p.id = ou.profile_id
    WHERE p.user_id = auth.uid() AND ou.role_id >= 2
  )
);

CREATE POLICY "Staff can delete their org's quizzes"
ON quizzes FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT ou.org_id FROM org_user ou
    JOIN profiles p ON p.id = ou.profile_id
    WHERE p.user_id = auth.uid() AND ou.role_id >= 2
  )
);

-- ============================================
-- RLS Policies for quiz_questions
-- ============================================

CREATE POLICY "Users can view questions of accessible quizzes"
ON quiz_questions FOR SELECT
TO authenticated
USING (
  quiz_id IN (SELECT id FROM quizzes)
);

CREATE POLICY "Staff can manage questions for their org's quizzes"
ON quiz_questions FOR ALL
TO authenticated
USING (
  quiz_id IN (
    SELECT q.id FROM quizzes q
    JOIN org_user ou ON ou.org_id = q.org_id
    JOIN profiles p ON p.id = ou.profile_id
    WHERE p.user_id = auth.uid() AND ou.role_id >= 2
  )
);

-- ============================================
-- RLS Policies for quiz_sessions
-- ============================================

CREATE POLICY "Users can view sessions they host or participate in"
ON quiz_sessions FOR SELECT
TO authenticated
USING (
  host_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR id IN (SELECT session_id FROM quiz_participants WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR org_id IN (SELECT ou.org_id FROM org_user ou JOIN profiles p ON p.id = ou.profile_id WHERE p.user_id = auth.uid())
);

CREATE POLICY "Staff can create sessions"
ON quiz_sessions FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT ou.org_id FROM org_user ou
    JOIN profiles p ON p.id = ou.profile_id
    WHERE p.user_id = auth.uid() AND ou.role_id >= 1
  )
);

CREATE POLICY "Host can update their sessions"
ON quiz_sessions FOR UPDATE
TO authenticated
USING (
  host_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- ============================================
-- RLS Policies for quiz_participants
-- ============================================

CREATE POLICY "Anyone can view participants in their session"
ON quiz_participants FOR SELECT
TO authenticated
USING (
  session_id IN (SELECT id FROM quiz_sessions)
);

CREATE POLICY "Users can join sessions"
ON quiz_participants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own participant record"
ON quiz_participants FOR UPDATE
TO authenticated
USING (
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR session_id IN (SELECT id FROM quiz_sessions WHERE host_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- RLS Policies for quiz_answers
-- ============================================

CREATE POLICY "Users can view answers in their sessions"
ON quiz_answers FOR SELECT
TO authenticated
USING (
  session_id IN (SELECT id FROM quiz_sessions)
);

CREATE POLICY "Users can submit answers"
ON quiz_answers FOR INSERT
TO authenticated
WITH CHECK (
  participant_id IN (SELECT id FROM quiz_participants WHERE profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- ============================================
-- Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quizzes_org_id ON quizzes(org_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_public ON quizzes(is_public);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_quiz_id ON quiz_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_pin_code ON quiz_sessions(pin_code);
CREATE INDEX IF NOT EXISTS idx_quiz_participants_session_id ON quiz_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);

-- ============================================
-- Enable Realtime for live updates
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_answers;

import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import HostModeClient from "./host-mode-client";
import { QuizOption } from "@/types/quiz";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function HostModePage({ params }: Props) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');

  // Fetch session with quiz and questions
  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .select(`
      *,
      quizzes(
        *,
        quiz_questions(*)
      ),
      organizations(org_namn)
    `)
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    notFound();
  }

  // Verify host
  if (session.host_id !== profile.id) {
    redirect('/staff/quiz');
  }

  // Get participants
  const { data: participants } = await supabase
    .from('quiz_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false });

  // Transform data
  const quizData = {
    id: session.quizzes.id,
    title: session.quizzes.title,
    questions: (session.quizzes.quiz_questions || [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((q: { id: string; question_text: string; time_limit_seconds: number; order_index: number; options: QuizOption[] }) => ({
        id: q.id,
        question_text: q.question_text,
        time_limit_seconds: q.time_limit_seconds,
        order_index: q.order_index,
        options: q.options as QuizOption[]
      }))
  };

  const sessionData = {
    id: session.id,
    pin_code: session.pin_code,
    status: session.status,
    access_policy: session.access_policy,
    current_question_index: session.current_question_index,
    current_state: session.current_state,
    org_name: session.organizations?.org_namn || 'Okänd'
  };

  return (
    <HostModeClient
      session={sessionData}
      quiz={quizData}
      initialParticipants={participants || []}
    />
  );
}

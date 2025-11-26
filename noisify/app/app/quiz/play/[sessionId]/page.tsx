import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import PlayerModeClient from "./player-mode-client";
import { QuizOption } from "@/types/quiz";

interface Props {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ participant?: string }>;
}

export default async function PlayerModePage({ params, searchParams }: Props) {
  const { sessionId } = await params;
  const { participant: participantId } = await searchParams;
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

  // Verify participant
  if (!participantId) {
    redirect('/app/quiz');
  }

  const { data: participant } = await supabase
    .from('quiz_participants')
    .select('*')
    .eq('id', participantId)
    .eq('session_id', sessionId)
    .single();

  if (!participant) {
    redirect('/app/quiz');
  }

  // Verify it belongs to this user
  if (participant.profile_id !== profile.id) {
    redirect('/app/quiz');
  }

  // Fetch session with quiz and questions
  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .select(`
      *,
      quizzes(
        *,
        quiz_questions(*)
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    notFound();
  }

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
    status: session.status,
    current_question_index: session.current_question_index,
    current_state: session.current_state
  };

  return (
    <PlayerModeClient
      session={sessionData}
      quiz={quizData}
      participant={participant}
    />
  );
}

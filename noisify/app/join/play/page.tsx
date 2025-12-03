import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import PlayerModeClient from "@/app/app/quiz/play/[sessionId]/player-mode-client";
import { QuizOption, ClientQuizOption } from "@/types/quiz";

interface Props {
    searchParams: Promise<{
        session?: string;
        participant?: string;
    }>;
}

export default async function GuestPlayerPage({ searchParams }: Props) {
    const { session: sessionId, participant: participantId } = await searchParams;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    if (!sessionId || !participantId) {
        redirect('/join');
    }

    // Verify participant (using normal client is fine here as they should be able to see their own participant record, 
    // but admin is safer to ensure we find it even if RLS is tricky for guests)
    // Actually, let's use admin for everything to be safe since this is a server component 
    // and we've already validated the IDs exist in the URL.
    const { data: participant } = await adminSupabase
        .from('quiz_participants')
        .select('*')
        .eq('id', participantId)
        .eq('session_id', sessionId)
        .single();

    if (!participant) {
        redirect('/join?error=Deltagare hittades inte');
    }

    // Fetch session with quiz and questions using admin client to bypass RLS
    const { data: session, error } = await adminSupabase
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
                options: (q.options as QuizOption[]).map(o => ({
                    text: o.text
                })) as ClientQuizOption[]
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
            exitPath="/join"
        />
    );
}

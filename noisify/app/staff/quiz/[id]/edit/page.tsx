import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import QuizFormClient from "../../quiz-form-client";
import { QuizCategory, QuizOption } from "@/types/quiz";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuizPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = cookieStore.get('noisify_staff_org')?.value;

  if (!orgId) {
    redirect('/staff');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check permission
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');

  const { data: orgUser } = await supabase
    .from('org_user')
    .select('role_id')
    .eq('profile_id', profile.id)
    .eq('org_id', orgId)
    .single();

  if (!orgUser || orgUser.role_id < 2) {
    redirect('/staff/quiz');
  }

  // Fetch quiz with questions
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      quiz_questions(*)
    `)
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error || !quiz) {
    notFound();
  }

  // Transform data
  const initialData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category as QuizCategory,
    cover_image_url: quiz.cover_image_url,
    is_public: quiz.is_public,
    questions: (quiz.quiz_questions || [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((q: { id: string; question_text: string; time_limit_seconds: number; options: QuizOption[] }) => ({
        id: q.id,
        question_text: q.question_text,
        time_limit_seconds: q.time_limit_seconds,
        options: q.options as QuizOption[]
      }))
  };

  return (
    <div className="max-w-4xl mx-auto">
      <QuizFormClient mode="edit" initialData={initialData} />
    </div>
  );
}

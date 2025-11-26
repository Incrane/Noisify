import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import QuizFormClient from "@/app/staff/quiz/quiz-form-client";

export default async function NewQuizPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = cookieStore.get('noisify_staff_org')?.value;

  if (!orgId) {
    redirect('/staff');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check if user has permission to create quizzes (role >= 2)
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

  return (
    <div className="max-w-4xl mx-auto">
      <QuizFormClient mode="create" />
    </div>
  );
}

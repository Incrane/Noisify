import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import QuizPageClient from "@/app/staff/quiz/quiz-page-client";

export default async function QuizPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = cookieStore.get('noisify_staff_org')?.value;

  if (!orgId) {
    redirect('/staff');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get profile and check role
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

  const roleId = orgUser?.role_id || 0;
  const canCreate = roleId >= 2;
  const canHost = roleId >= 1;

  // Fetch organization's quizzes
  const { data: myQuizzes } = await supabase
    .from('quizzes')
    .select(`
      *,
      quiz_questions(id),
      profiles!created_by(alias),
      organizations!org_id(org_namn)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  // Fetch public quizzes from other organizations (Community Library)
  const { data: communityQuizzes } = await supabase
    .from('quizzes')
    .select(`
      *,
      quiz_questions(id),
      profiles!created_by(alias),
      organizations!org_id(id, org_namn, logo_url)
    `)
    .eq('is_public', true)
    .neq('org_id', orgId)
    .order('created_at', { ascending: false });

  // Transform data
  const transformedMyQuizzes = (myQuizzes || []).map(quiz => ({
    ...quiz,
    question_count: quiz.quiz_questions?.length || 0,
    creator_alias: quiz.profiles?.alias || 'Okänd',
    org_name: quiz.organizations?.org_namn || 'Okänd'
  }));

  const transformedCommunityQuizzes = (communityQuizzes || []).map(quiz => ({
    ...quiz,
    question_count: quiz.quiz_questions?.length || 0,
    creator_alias: quiz.profiles?.alias || 'Okänd',
    org_name: quiz.organizations?.org_namn || 'Okänd',
    org_logo: quiz.organizations?.logo_url || null
  }));

  return (
    <QuizPageClient
      myQuizzes={transformedMyQuizzes}
      communityQuizzes={transformedCommunityQuizzes}
      canCreate={canCreate}
      canHost={canHost}
    />
  );
}

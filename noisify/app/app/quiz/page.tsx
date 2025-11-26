import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import QuizJoinClient from "./quiz-join-client";

export default async function QuizPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, alias')
    .eq('user_id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <QuizJoinClient
      profileId={profile.id}
      alias={profile.alias}
    />
  );
}

'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generatePinCode, QuizFormData, QuizOption } from "@/types/quiz";
import { createAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import { getSelectedOrganization } from "../actions";

// Get current user's profile ID
async function getProfileId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return profile?.id || null;
}

// Get current organization ID from cookie
async function getOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('noisify_staff_org')?.value || null;
}

// Check if user has staff permissions (role >= 2)
async function hasStaffPermission(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const profileId = await getProfileId();
  if (!profileId) return false;

  const { data } = await supabase
    .from('org_user')
    .select('role_id')
    .eq('profile_id', profileId)
    .eq('org_id', orgId)
    .single();

  return data?.role_id >= 2;
}

// Check if user can host quizzes (role >= 1, i.e. Vikarie can host but not create/edit)
async function canHostQuiz(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const profileId = await getProfileId();
  if (!profileId) return false;

  const { data } = await supabase
    .from('org_user')
    .select('role_id')
    .eq('profile_id', profileId)
    .eq('org_id', orgId)
    .single();

  return data?.role_id >= 1;
}

// Create a new quiz
export async function createQuiz(formData: QuizFormData) {
  const supabase = await createClient();
  const profileId = await getProfileId();
  const orgId = await getOrgId();

  if (!profileId || !orgId) {
    return { success: false, error: 'Du är inte inloggad eller har ingen vald organisation' };
  }

  if (!(await hasStaffPermission(orgId))) {
    return { success: false, error: 'Du har inte behörighet att skapa quiz' };
  }

  // Create quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      org_id: orgId,
      created_by: profileId,
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      cover_image_url: formData.cover_image_url || null,
      is_public: formData.is_public
    })
    .select('id')
    .single();

  if (quizError) {
    console.error('Create quiz error:', quizError);
    return { success: false, error: 'Kunde inte skapa quiz' };
  }

  // Create questions
  if (formData.questions.length > 0) {
    const questionsToInsert = formData.questions.map((q, index) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      time_limit_seconds: q.time_limit_seconds,
      order_index: index,
      options: q.options
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Create questions error:', questionsError);
      // Rollback quiz creation
      await supabase.from('quizzes').delete().eq('id', quiz.id);
      return { success: false, error: 'Kunde inte skapa frågor' };
    }
  }

  revalidatePath('/staff/quiz');
  return { success: true, quizId: quiz.id };
}

// Update an existing quiz
export async function updateQuiz(quizId: string, formData: QuizFormData) {
  const supabase = await createClient();
  const orgId = await getOrgId();

  if (!orgId) {
    return { success: false, error: 'Ingen organisation vald' };
  }

  if (!(await hasStaffPermission(orgId))) {
    return { success: false, error: 'Du har inte behörighet att redigera quiz' };
  }

  // Update quiz
  const { error: quizError } = await supabase
    .from('quizzes')
    .update({
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      cover_image_url: formData.cover_image_url || null,
      is_public: formData.is_public,
      updated_at: new Date().toISOString()
    })
    .eq('id', quizId);

  if (quizError) {
    console.error('Update quiz error:', quizError);
    return { success: false, error: 'Kunde inte uppdatera quiz' };
  }

  // Delete existing questions and recreate
  await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);

  if (formData.questions.length > 0) {
    const questionsToInsert = formData.questions.map((q, index) => ({
      quiz_id: quizId,
      question_text: q.question_text,
      time_limit_seconds: q.time_limit_seconds,
      order_index: index,
      options: q.options
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Update questions error:', questionsError);
      return { success: false, error: 'Kunde inte uppdatera frågor' };
    }
  }

  revalidatePath('/staff/quiz');
  revalidatePath(`/staff/quiz/${quizId}`);
  return { success: true };
}

// Delete a quiz
export async function deleteQuiz(quizId: string) {
  const supabase = await createClient();
  const orgId = await getOrgId();

  if (!orgId) {
    return { success: false, error: 'Ingen organisation vald' };
  }

  if (!(await hasStaffPermission(orgId))) {
    return { success: false, error: 'Du har inte behörighet att ta bort quiz' };
  }

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  if (error) {
    console.error('Delete quiz error:', error);
    return { success: false, error: 'Kunde inte ta bort quiz' };
  }

  revalidatePath('/staff/quiz');
  return { success: true };
}

// Clone a public quiz to own organization
export async function cloneQuiz(quizId: string) {
  const supabase = await createClient();
  const profileId = await getProfileId();
  const orgId = await getOrgId();

  if (!profileId || !orgId) {
    return { success: false, error: 'Du är inte inloggad eller har ingen vald organisation' };
  }

  if (!(await hasStaffPermission(orgId))) {
    return { success: false, error: 'Du har inte behörighet att klona quiz' };
  }

  // Get original quiz
  const { data: originalQuiz, error: fetchError } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('id', quizId)
    .single();

  if (fetchError || !originalQuiz) {
    return { success: false, error: 'Kunde inte hitta quiz att klona' };
  }

  // Create cloned quiz
  const { data: newQuiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      org_id: orgId,
      created_by: profileId,
      title: `${originalQuiz.title} (kopia)`,
      description: originalQuiz.description,
      category: originalQuiz.category,
      cover_image_url: originalQuiz.cover_image_url,
      is_public: false,
      cloned_from: quizId
    })
    .select('id')
    .single();

  if (quizError) {
    console.error('Clone quiz error:', quizError);
    return { success: false, error: 'Kunde inte klona quiz' };
  }

  // Clone questions
  if (originalQuiz.quiz_questions && originalQuiz.quiz_questions.length > 0) {
    const questionsToInsert = originalQuiz.quiz_questions.map((q: { question_text: string; time_limit_seconds: number; order_index: number; options: QuizOption[] }) => ({
      quiz_id: newQuiz.id,
      question_text: q.question_text,
      time_limit_seconds: q.time_limit_seconds,
      order_index: q.order_index,
      options: q.options
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionsToInsert);

    if (questionsError) {
      console.error('Clone questions error:', questionsError);
      await supabase.from('quizzes').delete().eq('id', newQuiz.id);
      return { success: false, error: 'Kunde inte klona frågor' };
    }
  }

  revalidatePath('/staff/quiz');
  return { success: true, quizId: newQuiz.id };
}

// Toggle quiz public status
export async function toggleQuizPublic(quizId: string, isPublic: boolean) {
  const supabase = await createClient();
  const orgId = await getOrgId();

  if (!orgId) {
    return { success: false, error: 'Ingen organisation vald' };
  }

  if (!(await hasStaffPermission(orgId))) {
    return { success: false, error: 'Du har inte behörighet' };
  }

  const { error } = await supabase
    .from('quizzes')
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', quizId);

  if (error) {
    console.error('Toggle public error:', error);
    return { success: false, error: 'Kunde inte ändra delningsstatus' };
  }

  revalidatePath('/staff/quiz');
  return { success: true };
}

// Create a new game session
export async function createSession(quizId: string, accessPolicy: 'ORG_ONLY' | 'OPEN') {
  const supabase = await createClient();
  const profileId = await getProfileId();
  const orgId = await getOrgId();

  if (!profileId || !orgId) {
    return { success: false, error: 'Du är inte inloggad eller har ingen vald organisation' };
  }

  if (!(await canHostQuiz(orgId))) {
    return { success: false, error: 'Du har inte behörighet att starta quiz' };
  }

  // Generate unique PIN
  let pinCode = generatePinCode();
  let attempts = 0;

  while (attempts < 10) {
    const { data: existing } = await supabase
      .from('quiz_sessions')
      .select('id')
      .eq('pin_code', pinCode)
      .single();

    if (!existing) break;
    pinCode = generatePinCode();
    attempts++;
  }

  const { data: session, error } = await supabase
    .from('quiz_sessions')
    .insert({
      quiz_id: quizId,
      org_id: orgId,
      host_id: profileId,
      pin_code: pinCode,
      access_policy: accessPolicy,
      status: 'LOBBY',
      current_state: 'WAITING_FOR_HOST'
    })
    .select('id, pin_code')
    .single();

  if (error) {
    console.error('Create session error:', error);
    return { success: false, error: 'Kunde inte starta quiz-session' };
  }

  return { success: true, sessionId: session.id, pinCode: session.pin_code };
}

// Update session state (for host controls)
export async function updateSessionState(
  sessionId: string,
  updates: {
    status?: 'LOBBY' | 'IN_PROGRESS' | 'SHOWING_RESULTS' | 'LEADERBOARD' | 'FINISHED';
    current_question_index?: number;
    current_state?: 'WAITING_FOR_HOST' | 'COUNTDOWN' | 'QUESTION_ACTIVE' | 'SHOW_ANSWER' | 'SHOW_LEADERBOARD';
    question_started_at?: string;
    ended_at?: string;
  }
) {
  const supabase = await createClient();
  const profileId = await getProfileId();

  if (!profileId) {
    return { success: false, error: 'Du är inte inloggad' };
  }

  // Verify host
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('host_id')
    .eq('id', sessionId)
    .single();

  if (!session || session.host_id !== profileId) {
    return { success: false, error: 'Du är inte värd för denna session' };
  }

  const { error } = await supabase
    .from('quiz_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) {
    console.error('Update session error:', error);
    return { success: false, error: 'Kunde inte uppdatera session' };
  }

  return { success: true };
}

// End session
export async function endSession(sessionId: string) {
  return updateSessionState(sessionId, {
    status: 'FINISHED',
    current_state: 'SHOW_LEADERBOARD',
    ended_at: new Date().toISOString()
  });
}

// Join a quiz session (for players)
export async function joinSession(pinCode: string, nickname: string, isGuest: boolean = false) {
  const supabase = await createClient();

  // Find session
  const { data: session, error: sessionError } = await supabase
    .from('quiz_sessions')
    .select('id, org_id, access_policy, status')
    .eq('pin_code', pinCode)
    .single();

  if (sessionError || !session) {
    return { success: false, error: 'Ingen quiz hittades med denna PIN-kod' };
  }

  if (session.status !== 'LOBBY') {
    return { success: false, error: 'Quizen har redan startat' };
  }

  let profileId: string | null = null;

  if (!isGuest) {
    profileId = await getProfileId();

    if (!profileId) {
      return { success: false, error: 'Du måste vara inloggad för att delta' };
    }

    // Check org membership for ORG_ONLY sessions
    if (session.access_policy === 'ORG_ONLY') {
      const { data: membership } = await supabase
        .from('org_user')
        .select('id')
        .eq('profile_id', profileId)
        .eq('org_id', session.org_id)
        .single();

      if (!membership) {
        // Get org name for better error message
        const { data: org } = await supabase
          .from('organizations')
          .select('org_namn')
          .eq('id', session.org_id)
          .single();

        return {
          success: false,
          error: `Denna quiz är endast för medlemmar i ${org?.org_namn || 'organisationen'}`
        };
      }
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('quiz_participants')
      .select('id')
      .eq('session_id', session.id)
      .eq('profile_id', profileId)
      .single();

    if (existing) {
      return { success: true, participantId: existing.id, alreadyJoined: true };
    }
  } else {
    // Guest can only join OPEN sessions
    if (session.access_policy !== 'OPEN') {
      return { success: false, error: 'Gäster kan endast delta i öppna quizzes' };
    }
  }

  // Create participant
  const { data: participant, error: joinError } = await supabase
    .from('quiz_participants')
    .insert({
      session_id: session.id,
      profile_id: profileId,
      guest_name: isGuest ? nickname : null,
      nickname: nickname
    })
    .select('id')
    .single();

  if (joinError) {
    console.error('Join session error:', joinError);
    return { success: false, error: 'Kunde inte gå med i quizen' };
  }

  return { success: true, participantId: participant.id, sessionId: session.id };
}

// Submit an answer
// Submit an answer
export async function submitAnswer(
  sessionId: string,
  participantId: string,
  questionIndex: number,
  selectedOption: number,
  timeTakenMs: number
) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get the question to check if answer is correct
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('quiz_id, current_question_index')
    .eq('id', sessionId)
    .single();

  if (!session || session.current_question_index !== questionIndex) {
    return { success: false, error: 'Frågan är inte aktiv' };
  }

  // Use admin client to fetch question details (bypass RLS)
  const { data: question } = await adminSupabase
    .from('quiz_questions')
    .select('options, time_limit_seconds')
    .eq('quiz_id', session.quiz_id)
    .eq('order_index', questionIndex)
    .single();

  if (!question) {
    return { success: false, error: 'Frågan hittades inte' };
  }

  const options = question.options as QuizOption[];
  const isCorrect = options[selectedOption]?.isCorrect || false;

  // Get current participant data for streak calculation
  const { data: participant } = await supabase
    .from('quiz_participants')
    .select('streak, score, profile_id')
    .eq('id', participantId)
    .single();

  if (!participant) {
    return { success: false, error: 'Deltagare hittades inte' };
  }

  // Verify ownership if it's a logged-in user
  if (participant.profile_id) {
    const profileId = await getProfileId();
    if (participant.profile_id !== profileId) {
      console.error(`SubmitAnswer Auth Mismatch: Participant Profile=${participant.profile_id}, Current User Profile=${profileId}`);
      return { success: false, error: 'Du har inte behörighet att svara för denna deltagare' };
    }
  }

  const currentStreak = participant.streak || 0;
  const currentScore = participant.score || 0;

  // Calculate points
  const timeLimitMs = question.time_limit_seconds * 1000;
  let pointsEarned = 0;
  let newStreak = 0;

  if (isCorrect) {
    const basePoints = 1000;
    const timeRatio = Math.max(0, 1 - (timeTakenMs / timeLimitMs));
    const timeBonus = Math.round(timeRatio * 500);
    const streakMultiplier = Math.min(0.5, currentStreak * 0.1);
    const streakBonus = Math.round(basePoints * streakMultiplier);
    pointsEarned = basePoints + timeBonus + streakBonus;
    newStreak = currentStreak + 1;
  }

  // Insert answer using admin client to bypass RLS
  const { error: answerError } = await adminSupabase
    .from('quiz_answers')
    .insert({
      session_id: sessionId,
      participant_id: participantId,
      question_index: questionIndex,
      selected_option: selectedOption,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      points_earned: pointsEarned
    });

  if (answerError) {
    if (answerError.code === '23505') {
      return { success: false, error: 'Du har redan svarat på denna fråga' };
    }
    console.error('Submit answer error:', answerError);
    return { success: false, error: 'Kunde inte skicka svar' };
  }

  // Update participant score and streak using admin client
  await adminSupabase
    .from('quiz_participants')
    .update({
      score: currentScore + pointsEarned,
      streak: newStreak,
      last_answer_at: new Date().toISOString()
    })
    .eq('id', participantId);

  return {
    success: true,
    isCorrect,
    pointsEarned,
    newStreak,
    totalScore: currentScore + pointsEarned
  };
}

// Get leaderboard for a session
export async function getLeaderboard(sessionId: string) {
  const supabase = await createClient();

  const { data: participants, error } = await supabase
    .from('quiz_participants')
    .select('id, nickname, score, streak')
    .eq('session_id', sessionId)
    .order('score', { ascending: false });

  if (error) {
    console.error('Get leaderboard error:', error);
    return [];
  }

  return participants.map((p, index) => ({
    participant_id: p.id,
    nickname: p.nickname,
    score: p.score,
    streak: p.streak,
    rank: index + 1
  }));
}

export async function uploadQuizCover(formData: FormData) {
  const supabase = await createClient();
  const orgId = await getSelectedOrganization();

  if (!orgId) return { error: "Ingen organisation vald" };

  const file = formData.get("file") as File;
  if (!file) return { error: "Ingen fil vald" };

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { error: "Endast bilder är tillåtna (JPG, PNG, WEBP)" };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Filen är för stor. Maxstorlek är 5MB." };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `quiz-cover_${orgId}_${Date.now()}.${fileExt}`;
  const filePath = `quiz-covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("public_images")
    .upload(filePath, file);

  if (uploadError) {
    return { error: "Kunde inte ladda upp omslagsbild: " + uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from("public_images")
    .getPublicUrl(filePath);

  return { success: true, url: publicUrl };
}

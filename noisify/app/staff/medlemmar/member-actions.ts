'use server';

import { createClient } from '@/utils/supabase/server';

export async function getPrivateMemberInfo(userId: string) {
  const supabase = await createClient();

  // Only authorized staff should be able to access this
  // The RLS policies on users_private should handle this, but we check auth first
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('users_private')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching private user info:', error);
    return { success: false, error: 'Could not fetch private info' };
  }

  return { success: true, data };
}

export async function sendNotification(userId: string, title: string, message: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabase.rpc('create_notification_from_staff', {
    p_assigned_user_id: userId,
    p_title: title,
    p_message: message,
    p_type: 'info'
  });

  if (error || !data) {
    console.error('Error sending notification:', error);
    return { success: false, error: 'Kunde inte skicka notis' };
  }

  return { success: true, message: 'Notis skickad' };
}

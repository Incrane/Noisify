'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMembers(orgId: string, query: string = '', filter: 'all' | 'active' | 'inactive' = 'all') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rpcData, error } = await supabase.rpc('get_org_members_json', {
    p_org_id: orgId,
    p_user_id: user.id
  });

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  let data = rpcData as any[];
  console.log('RPC Data count:', data.length);

  if (filter === 'active') {
    data = data.filter((m: any) => m.membership_state === 'active');
  } else if (filter === 'inactive') {
    data = data.filter((m: any) => ['expired', 'cancelled'].includes(m.membership_state));
  }

  // Filter by query (search alias)
  let members = data.map((m: any) => {
    const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return {
      id: m.id,
      profileId: profile?.id,
      alias: profile?.alias || 'Namnlös',
      userId: profile?.user_id,
      status: m.membership_state,
      startDate: m.starts_at,
      endDate: m.ends_at,
      isLocal: !profile?.user_id,
      birthYear: profile?.fodd_ar || 0
    };
  });

  if (query) {
    const lowerQuery = query.toLowerCase();
    members = members.filter(m =>
      m.alias.toLowerCase().includes(lowerQuery)
    );
  }

  console.log('Filtered members count:', members.length);
  return members;
}

export async function inviteMember(_orgId: string, _email: string, _startDate: string, _endDate: string | null) {
  // Placeholder for invite logic
  // Since we cannot easily lookup users by email without admin privileges, 
  // and we cannot send emails without an edge function or service,
  // we will return an error for now or a mock success if intended for demo.

  return { error: "Funktionen 'Bjuda in via e-post' kräver backend-stöd (Edge Function) för att slå upp/skapa användare." };
}

export async function createLocalMember(orgId: string, alias: string, _orgIdNum: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 1. Create a Profile with NULL user_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      alias: alias,
      user_id: null
    })
    .select()
    .single();

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return { error: 'Kunde inte skapa profil. Kontrollera att databasen stödjer lokala medlemmar (user_id = null).' };
  }

  // 2. Create Membership
  const { error: membershipError } = await supabase
    .from('memberships')
    .insert({
      org_id: orgId,
      profile_id: profile.id,
      membership_state: 'active',
      start_date: new Date().toISOString(),
    });

  if (membershipError) {
    console.error('Error creating membership:', membershipError);
    // Should probably rollback profile creation here in a real app
    return { error: 'Kunde inte skapa medlemskap.' };
  }

  revalidatePath('/staff/medlemmar');
  return { success: true };
}

export async function updateMemberStatus(membershipId: string, status: 'active' | 'rejected' | 'cancelled', orgId: string) {
  const supabase = await createClient();

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify staff access to org
  const { data: staffRole } = await supabase
    .from('org_user')
    .select('role_id')
    .eq('org_id', orgId)
    .eq('profile_id', (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data?.id)
    .single();

  if (!staffRole || staffRole.role_id < 1) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('memberships')
    .update({
      membership_state: status,
      state_changed_at: new Date().toISOString(),
      // Optionally set state_reason if we passed it
    })
    .eq('id', membershipId)
    .eq('org_id', orgId);

  if (error) {
    console.error('Error updating membership:', error);
    return { error: 'Kunde inte uppdatera medlemskap' };
  }

  revalidatePath('/staff/medlemmar');
  return { success: true };
}

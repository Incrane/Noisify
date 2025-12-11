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
      birthYear: profile?.fodd_ar || 0,
      first_name: profile?.first_name,
      last_name: profile?.last_name,
      email: profile?.email,
      phone_number: profile?.phone_number,
      verk_id_nummer: profile?.verk_id_nummer,
      notes: profile?.notes,
      birth_date: profile?.birth_date,
      isVerified: profile?.is_verified || false
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

export async function getMemberByProfileId(orgId: string, profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Reuse the get_org_members_json RPC or just query directly if RPC is heavy?
  // RPC is good because it handles logic. But it returns all members.
  // Direct select might be faster for single row.

  // Let's try direct select for efficiency, mimicking the structure.
  const { data: memberData, error } = await supabase
    .from('memberships')
    .select(`
      id,
      membership_state,
      starts_at,
      ends_at,
      profile:profiles (
        id,
        user_id,
        alias,
        email,
        first_name,
        last_name,
        phone_number,
        verk_id_nummer,
        notes,
        birth_date,
        fodd_ar,
        is_verified
      )
    `)
    .eq('org_id', orgId)
    .eq('profile_id', profileId)
    .single();

  if (error || !memberData) {
    // Fallback: Check if they are a profile (e.g. Staff) but not a member
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
            id,
            user_id,
            alias,
            email,
            first_name,
            last_name,
            phone_number,
            verk_id_nummer,
            notes,
            birth_date,
            fodd_ar,
            is_verified
        `)
      .eq('id', profileId)
      .single();

    if (profileError || !profileData) {
      return { error: 'Medlem hittades inte' };
    }

    // Check if staff
    const { data: staffRole } = await supabase
      .from('org_user')
      .select('role_id')
      .eq('org_id', orgId)
      .eq('profile_id', profileId)
      .single();

    const isStaff = staffRole && staffRole.role_id >= 1;

    return {
      success: true,
      member: {
        id: 'no-membership', // Placeholder
        profileId: profileData.id,
        alias: profileData.alias || 'Namnlös',
        userId: profileData.user_id,
        status: isStaff ? 'Personal' : 'Ej medlem',
        startDate: null,
        endDate: null,
        isLocal: !profileData.user_id,
        birthYear: profileData.fodd_ar || 0,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone_number: profileData.phone_number,
        verk_id_nummer: profileData.verk_id_nummer,
        notes: profileData.notes,
        birth_date: profileData.birth_date,
        isVerified: profileData.is_verified || false
      }
    };
  }

  const m = memberData;
  const p = m.profile as any; // Type assertion

  const member = {
    id: m.id,
    profileId: p?.id,
    alias: p?.alias || 'Namnlös',
    userId: p?.user_id,
    status: m.membership_state,
    startDate: m.starts_at,
    endDate: m.ends_at,
    isLocal: !p?.user_id,
    birthYear: p?.fodd_ar || 0,
    // Extra fields
    first_name: p?.first_name,
    last_name: p?.last_name,
    email: p?.email,
    phone_number: p?.phone_number,
    verk_id_nummer: p?.verk_id_nummer,
    notes: p?.notes,
    birth_date: p?.birth_date,
    isVerified: p?.is_verified || false
  };

  return { success: true, member };
}

export async function inviteMember(_orgId: string, _email: string, _startDate: string, _endDate: string | null) {
  // Placeholder for invite logic
  // Since we cannot easily lookup users by email without admin privileges, 
  // and we cannot send emails without an edge function or service,
  // we will return an error for now or a mock success if intended for demo.

  return { error: "Funktionen 'Bjuda in via e-post' kräver backend-stöd (Edge Function) för att slå upp/skapa användare." };
}

export async function createLocalMember(
  orgId: string,
  alias: string,
  orgIdNum: string,
  details?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // 1. Get Organization City
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('city_id, org_namn')
    .eq('id', orgId)
    .single();

  if (orgError) {
    console.error('Error fetching org:', orgError);
    return { error: 'Kunde inte hämta organisationen' };
  }

  // 2. Create "Shadow" Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      alias: alias,
      account_type: 'local',
      city_id: org.city_id,
      user_id: null, // Explicitly null for local users
      // Store names in profiles? Or relying on local_members?
      // Profiles has no name columns? Wait, search_in_file showed users_private!
      // But we can't insert into users_private without a user_id (it references auth.users usually?)
      // Let's check users_private schema.
      // If profiles doesn't have first/last name, we might rely on the local_members record for details.
      // But t_player_stats relies on profiles. 
      // The "Add Player" modal uses getOrganizationMembersForTournament which joins profiles -> users_private.
      // If users_private requires a user_id, we can't use it for local members.
      // We might need to add first_name/last_name to profiles OR allow users_private to have null user_id?
      // Let's check users_private schema.
    })
    .select('id')
    .single();

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return { error: 'Kunde inte skapa profil för lokal medlem.' };
  }

  // 3. Create Membership
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
    // Cleanup profile? 
    await supabase.from('profiles').delete().eq('id', profile.id);
    return { error: 'Kunde inte skapa medlemskap.' };
  }

  // 4. Insert into local_members table (linked to profile)
  const { error } = await supabase
    .from('local_members')
    .insert({
      org_id: orgId,
      alias: alias,
      verk_id_nummer: orgIdNum,
      status: 'active',
      first_name: details?.firstName,
      last_name: details?.lastName,
      email: details?.email,
      phone_number: details?.phone,
      birth_date: details?.birthDate,
      notes: details?.notes,
      profile_id: profile.id
    });

  if (error) {
    console.error('Error creating local member:', error);
    // Cleanup
    await supabase.from('memberships').delete().eq('profile_id', profile.id).eq('org_id', orgId);
    await supabase.from('profiles').delete().eq('id', profile.id);
    return { error: 'Kunde inte skapa lokal medlem.' };
  }

  revalidatePath('/staff/medlemmar');
  return { success: true };
}

export async function updateLocalMember(
  memberId: string,
  orgId: string,
  data: {
    alias?: string;
    verkIdNummer?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Verify staff access (handled by RLS but good to check)

  const { error } = await supabase
    .from('local_members')
    .update({
      alias: data.alias,
      verk_id_nummer: data.verkIdNummer,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone_number: data.phone,
      birth_date: data.birthDate,
      notes: data.notes
    })
    .eq('id', memberId)
    .eq('org_id', orgId);

  if (error) {
    console.error('Error updating local member:', error);
    return { error: 'Kunde inte uppdatera lokal medlem.' };
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

export async function getPrivateMemberInfo(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Try to fetch from users_private using user_id column
  const { data, error } = await supabase
    .from('users_private')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching private info', error);
    return { error: 'Kunde inte hämta personuppgifter' };
  }

  return { success: true, data };
}

export async function sendNotification(userId: string, title: string, message: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      read: false
    });

  if (error) {
    console.error('Error sending notification', error);
    return { error: 'Kunde inte skicka notis' };
  }

  return { success: true };
}

// ============================================================
// MEMBER MANAGEMENT ACTIONS
// ============================================================

/**
 * Helper function to verify staff access (role 2+)
 */
async function verifyStaffAccess(supabase: any, userId: string, orgId: string): Promise<{ authorized: boolean; profileId?: string; error?: string }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    return { authorized: false, error: 'Profil hittades inte' };
  }

  const { data: staffRole } = await supabase
    .from('org_user')
    .select('role_id')
    .eq('org_id', orgId)
    .eq('profile_id', profile.id)
    .single();

  if (!staffRole || staffRole.role_id < 2) {
    return { authorized: false, error: 'Du har inte behörighet att utföra denna åtgärd' };
  }

  return { authorized: true, profileId: profile.id };
}

/**
 * Ban member from organization - sets membership_state to 'suspended'
 */
export async function banMemberFromOrg(membershipId: string, orgId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const access = await verifyStaffAccess(supabase, user.id, orgId);
  if (!access.authorized) return { error: access.error };

  const { error } = await supabase
    .from('memberships')
    .update({
      membership_state: 'suspended',
      state_changed_at: new Date().toISOString(),
      state_reason: reason || 'Blockerad av personal'
    })
    .eq('id', membershipId)
    .eq('org_id', orgId);

  if (error) {
    console.error('Error banning member:', error);
    return { error: 'Kunde inte blockera medlemmen' };
  }

  revalidatePath('/staff/medlemmar');
  return { success: true, message: 'Medlemmen har blockerats från organisationen' };
}

/**
 * Cancel membership - sets membership_state to 'cancelled'
 */
export async function cancelMembership(membershipId: string, orgId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const access = await verifyStaffAccess(supabase, user.id, orgId);
  if (!access.authorized) return { error: access.error };

  const { error } = await supabase
    .from('memberships')
    .update({
      membership_state: 'cancelled',
      state_changed_at: new Date().toISOString(),
      state_reason: reason || 'Avslutat av personal'
    })
    .eq('id', membershipId)
    .eq('org_id', orgId);

  if (error) {
    console.error('Error cancelling membership:', error);
    return { error: 'Kunde inte avsluta medlemskapet' };
  }

  revalidatePath('/staff/medlemmar');
  return { success: true, message: 'Medlemskapet har avslutats' };
}

/**
 * Reactivate membership - sets membership_state to 'active'
 */
export async function reactivateMembership(membershipId: string, orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const access = await verifyStaffAccess(supabase, user.id, orgId);
  if (!access.authorized) return { error: access.error };

  const { error } = await supabase
    .from('memberships')
    .update({
      membership_state: 'active',
      state_changed_at: new Date().toISOString(),
      state_reason: null
    })
    .eq('id', membershipId)
    .eq('org_id', orgId);

  if (error) {
    console.error('Error reactivating membership:', error);
    return { error: 'Kunde inte återaktivera medlemskapet' };
  }

  revalidatePath('/staff/medlemmar');
  return { success: true, message: 'Medlemskapet har återaktiverats' };
}

/**
 * Require user to change alias - sets requires_alias_change to true and bans the old alias
 */
export async function requireNewAlias(profileId: string, orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const access = await verifyStaffAccess(supabase, user.id, orgId);
  if (!access.authorized) return { error: access.error };

  // Get current alias to ban it
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('alias')
    .eq('id', profileId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    return { error: 'Kunde inte hitta användarprofilen' };
  }

  const oldAlias = profile.alias;

  // Set requires_alias_change to true
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      requires_alias_change: true
    })
    .eq('id', profileId);

  if (updateError) {
    console.error('Error requiring alias change:', updateError);
    return { error: 'Kunde inte kräva aliasbyte' };
  }

  // Ban the old alias
  if (oldAlias) {
    const { error: banError } = await supabase
      .from('blocked_alias')
      .insert({
        alias: oldAlias.toLowerCase()
      });

    if (banError) {
      // Don't fail the whole operation if alias is already banned
      console.warn('Could not ban alias (might already be banned):', banError);
    }
  }

  revalidatePath('/staff/medlemmar');
  return { success: true, message: 'Användaren måste nu välja ett nytt alias' };
}

/**
 * Send warning notification to member
 */
export async function sendWarningNotification(profileId: string, orgId: string, warningMessage: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const access = await verifyStaffAccess(supabase, user.id, orgId);
  if (!access.authorized) return { error: access.error };

  // Get org name for the notification
  const { data: org } = await supabase
    .from('organizations')
    .select('org_namn')
    .eq('id', orgId)
    .single();

  // Use the correct RPC signature (without p_org_id)
  const { error } = await supabase.rpc('create_notification_from_staff', {
    p_assigned_user_id: profileId,
    p_title: `Varning från ${org?.org_namn || 'Organisationen'}`,
    p_message: warningMessage,
    p_type: 'system_announcement'
  });

  if (error) {
    console.error('Error sending warning notification:', error);
    return { error: 'Kunde inte skicka varningen' };
  }

  return { success: true, message: 'Varning skickad till medlemmen' };
}

/**
 * Remove member from all chat groups in the organization
 */
export async function removeMemberFromChatGroups(profileId: string, orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const access = await verifyStaffAccess(supabase, user.id, orgId);
  if (!access.authorized) return { error: access.error };

  // Get all chat groups for this org where the member is a participant
  const { data: participantRecords, error: fetchError } = await supabase
    .from('chat_participants')
    .select('id, group_id, chat_groups!inner(org_id)')
    .eq('profile_id', profileId)
    .eq('chat_groups.org_id', orgId);

  if (fetchError) {
    console.error('Error fetching chat participations:', fetchError);
    return { error: 'Kunde inte hämta chattdeltaganden' };
  }

  if (!participantRecords || participantRecords.length === 0) {
    return { success: true, message: 'Medlemmen var inte med i några chattgrupper' };
  }

  // Remove from all groups
  const participantIds = participantRecords.map((p: any) => p.id);

  const { error: deleteError } = await supabase
    .from('chat_participants')
    .delete()
    .in('id', participantIds);

  if (deleteError) {
    console.error('Error removing from chat groups:', deleteError);
    return { error: 'Kunde inte ta bort från chattgrupper' };
  }

  return { success: true, message: `Medlemmen har tagits bort från ${participantRecords.length} chattgrupp(er)` };
}

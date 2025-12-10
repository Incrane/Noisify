'use server';

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface ChatMember {
    id: string;
    name: string;
}

export async function getChatEligibleMembers(orgId: string): Promise<ChatMember[]> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Use the same RPC as the members page to ensure consistency and permissions
    const { data: rpcData, error } = await supabase.rpc('get_org_members_json', {
        p_org_id: orgId,
        p_user_id: user.id
    });

    if (error) {
        console.error('Error fetching chat members:', error);
        return [];
    }

    const data = rpcData as any[];

    // Filter for:
    // 1. Active membership
    // 2. Digital users (user_id is not null)
    const eligibleMembers = data
        .filter((m: any) => {
            const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
            return (
                m.membership_state === 'active' &&
                profile?.user_id != null // Must have a user_id to be a digital user
            );
        })
        .map((m: any) => {
            const profile = Array.isArray(m.profile) ? m.profile[0] : m.profile;
            return {
                id: profile.id,
                name: profile.alias || 'Namnlös'
            };
        });

    return eligibleMembers;
}

export async function createQuestionGroup(orgId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, alias')
        .eq('user_id', user.id)
        .single();

    if (!profile) throw new Error('Profile not found');

    // Check if muted
    const { data: membership } = await supabase
        .from('memberships')
        .select('muted_until')
        .eq('org_id', orgId)
        .eq('profile_id', profile.id)
        .single();

    if (membership?.muted_until && new Date(membership.muted_until) > new Date()) {
        const date = new Date(membership.muted_until).toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        throw new Error(`Du är mutad till ${date} och kan inte ställa frågor.`);
    }

    // Use admin client for privileged operations (fetching staff, creating group with multiple participants)
    const adminSupabase = createAdminClient();

    // Get all staff for this org
    const { data: staffMembers } = await adminSupabase
        .from('org_user')
        .select('profile_id')
        .eq('org_id', orgId)
        .gte('role_id', 2); // Role 2+ is staff

    if (!staffMembers || staffMembers.length === 0) {
        throw new Error('Ingen personal tillgänglig att svara på frågor.');
    }

    // Create group
    const { data: group, error: groupError } = await adminSupabase
        .from('chat_groups')
        .insert({
            org_id: orgId,
            name: `Fråga från ${profile.alias}`,
            created_by: profile.id
        })
        .select()
        .single();

    if (groupError) throw groupError;

    // Add participants (Member + All Staff)
    const participants = [
        { group_id: group.id, profile_id: profile.id, role: 'member' }, // The member asking
        ...staffMembers.map(s => ({ group_id: group.id, profile_id: s.profile_id, role: 'admin' })) // Staff are admins
    ];

    const { error: participantsError } = await adminSupabase
        .from('chat_participants')
        .insert(participants);

    if (participantsError) throw participantsError;

    return group;
}

export async function muteMember(orgId: string, profileId: string, durationMinutes: number) {
    const supabase = await createClient();

    // Check permissions (must be staff)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: myRole } = await supabase
        .from('org_user')
        .select('role_id')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single();

    if (!myRole || myRole.role_id < 2) {
        throw new Error('Unauthorized');
    }

    const mutedUntil = new Date();
    mutedUntil.setMinutes(mutedUntil.getMinutes() + durationMinutes);

    const { error } = await supabase
        .from('memberships')
        .update({ muted_until: mutedUntil.toISOString() })
        .eq('org_id', orgId)
        .eq('profile_id', profileId);

    if (error) throw error;
}

export async function unmuteMember(orgId: string, profileId: string) {
    const supabase = await createClient();

    // Check permissions (must be staff)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: myRole } = await supabase
        .from('org_user')
        .select('role_id')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single();

    if (!myRole || myRole.role_id < 2) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('memberships')
        .update({ muted_until: null })
        .eq('org_id', orgId)
        .eq('profile_id', profileId);

    if (error) throw error;
}

export async function getMemberMuteStatus(orgId: string, profileId: string) {
    const supabase = await createClient();

    const { data } = await supabase
        .from('memberships')
        .select('muted_until')
        .eq('org_id', orgId)
        .eq('profile_id', profileId)
        .single();

    if (!data?.muted_until) return null;

    const mutedUntil = new Date(data.muted_until);
    if (mutedUntil <= new Date()) return null;

    return mutedUntil;
}

export async function startStaffChat(orgId: string, memberProfileId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify staff access
    const { data: myRole } = await supabase
        .from('org_user')
        .select('role_id')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .single();

    if (!myRole || myRole.role_id < 2) {
        throw new Error('Unauthorized');
    }

    // Check for existing group with this member in this org
    // We look for groups where the member is a participant
    const { data: existingGroups } = await supabase
        .from('chat_participants')
        .select('group_id, chat_groups!inner(created_at)')
        .eq('profile_id', memberProfileId)
        .eq('chat_groups.org_id', orgId)
        .order('chat_groups(created_at)', { ascending: false, foreignTable: 'chat_groups' })
        .limit(1);

    if (existingGroups && existingGroups.length > 0) {
        return { success: true, groupId: existingGroups[0].group_id };
    }

    // If no existing group, create one
    // Get member details for name
    const { data: memberProfile } = await supabase
        .from('profiles')
        .select('alias')
        .eq('id', memberProfileId)
        .single();

    const memberName = memberProfile?.alias || 'Medlem';

    // Create group
    const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
            org_id: orgId,
            name: `Chatt med ${memberName}`,
            created_by: memberProfileId // Or should it be created by staff? Maybe staff. Let's use member ID as "owner" context or just staff. Actually let's set created_by to the member if possible so it looks like "their" chat, or strictly speaking the staff started it. Let's set it to the member ID to be consistent with "Fråga från..." logic if that helps, or just the current user. 
            // Actually, created_by usually implies owner. If staff creates it, staff ID.
        })
        .select()
        .single();

    // If insert fails (maybe RLS on created_by?), try with current user ID
    if (groupError) {
        // Fallback or re-throw. Let's try inserting with current user (staff) as created_by
        const { data: group2, error: groupError2 } = await supabase
            .from('chat_groups')
            .insert({
                org_id: orgId,
                name: `Chatt med ${memberName}`,
                // created_by default to auth.uid() in DB often, or we pass it
                created_by: (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data?.id
            })
            .select()
            .single();

        if (groupError2) throw groupError2;

        // Add participants
        await addParticipantsToGroup(supabase, group2.id, orgId, memberProfileId);
        return { success: true, groupId: group2.id };
    }

    await addParticipantsToGroup(supabase, group.id, orgId, memberProfileId);
    return { success: true, groupId: group.id };
}

async function addParticipantsToGroup(supabase: any, groupId: string, orgId: string, memberProfileId: string) {
    // Get all staff
    const { data: staffMembers } = await supabase
        .from('org_user')
        .select('profile_id')
        .eq('org_id', orgId)
        .gte('role_id', 2);

    const participants = [
        { group_id: groupId, profile_id: memberProfileId, role: 'member' },
        ...(staffMembers || []).map((s: any) => ({ group_id: groupId, profile_id: s.profile_id, role: 'admin' }))
    ];

    // Filter duplicates if any (e.g. if member is also staff? Unlikely but possible)
    const uniqueParticipants = Array.from(new Map(participants.map(item => [item.profile_id, item])).values());

    const { error } = await supabase
        .from('chat_participants')
        .insert(uniqueParticipants);

    if (error) throw error;
}

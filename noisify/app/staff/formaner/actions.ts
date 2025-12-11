'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export interface PerkType {
    id: string;
    name: string;
    description: string | null;
    category: 'ROOM_ACCESS' | 'DISCOUNT' | 'PRIORITY_BOOKING' | 'OTHER';
    icon: string | null;
    is_active: boolean;
    created_by_org_id: string;
    is_owned: boolean;
    is_shared: boolean;
    shared_by_org_name: string | null;
    user_count: number;
    room_count: number;
    course_count: number;
    created_at?: string;
    updated_at?: string;
}

export interface UserPerk {
    id: string;
    perk_type_id: string | null;
    perk_name: string;
    perk_description: string | null;
    perk_category: 'ROOM_ACCESS' | 'DISCOUNT' | 'PRIORITY_BOOKING' | 'OTHER';
    perk_icon: string | null;
    org_id: string;
    org_name: string;
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
    source_type: 'manual' | 'course' | 'membership' | 'event';
    granted_at: string;
    expires_at: string | null;
    granted_by_name: string | null;
}

export interface PerkTypeShare {
    id: string;
    perk_type_id: string;
    org_id: string;
    invited_by_org_id: string;
    status: 'pending' | 'active' | 'rejected';
    created_at: string;
    responded_at: string | null;
    perk_type?: PerkType;
    org?: { id: string; name: string };
    invited_by_org?: { id: string; name: string };
}

// Get current user's organization from cookie or first available
async function getCurrentOrgId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Import cookies to read selected org
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const selectedOrg = cookieStore.get('noisify_staff_org')?.value;

    if (selectedOrg) {
        return selectedOrg;
    }

    // Fallback: get first org for user
    const { data: orgUser } = await supabase
        .from('org_user')
        .select('org_id')
        .eq('profile_id', user.id)
        .gte('role_id', 1)
        .limit(1);

    return orgUser?.[0]?.org_id || null;
}

// ============================
// PERK TYPE CRUD
// ============================

export async function getPerkTypes(orgId?: string): Promise<{ data: PerkType[] | null; error: string | null }> {
    const supabase = await createClient();
    const targetOrgId = orgId || await getCurrentOrgId();

    if (!targetOrgId) {
        return { data: null, error: 'Ingen organisation hittades' };
    }

    // Use direct query since RPC might not be available yet
    const { data: ownPerks, error: ownError } = await supabase
        .from('perk_types')
        .select('*')
        .eq('created_by_org_id', targetOrgId)
        .order('name');

    if (ownError) {
        console.error('Error fetching perk types:', ownError);
        return { data: null, error: 'Kunde inte hämta förmåner' };
    }

    // Add computed fields
    const perksWithCounts = (ownPerks || []).map(perk => ({
        ...perk,
        is_owned: true,
        is_shared: false,
        shared_by_org_name: null,
        user_count: 0, // Would need separate query
        room_count: 0,
        course_count: 0
    }));

    return { data: perksWithCounts, error: null };
}

export async function getPerkTypeById(id: string): Promise<{ data: PerkType | null; error: string | null }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('perk_types')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching perk type:', error);
        return { data: null, error: 'Kunde inte hämta förmånen' };
    }

    return {
        data: {
            ...data,
            is_owned: true,
            is_shared: false,
            shared_by_org_name: null,
            user_count: 0,
            room_count: 0,
            course_count: 0
        },
        error: null
    };
}

export interface CreatePerkTypeData {
    name: string;
    description?: string;
    category: 'ROOM_ACCESS' | 'DISCOUNT' | 'PRIORITY_BOOKING' | 'OTHER';
    icon?: string;
}

export async function createPerkType(data: CreatePerkTypeData): Promise<{ data: PerkType | null; error: string | null }> {
    const supabase = await createClient();
    const orgId = await getCurrentOrgId();

    if (!orgId) {
        return { data: null, error: 'Ingen organisation hittades' };
    }

    // Generate slug from name
    const slug = data.name
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 50);

    const { data: perkType, error } = await supabase
        .from('perk_types')
        .insert({
            name: data.name,
            slug: slug + '-' + Date.now().toString(36),
            description: data.description || null,
            category: data.category,
            icon: data.icon || null,
            icon_url: data.icon || null,
            org_id: orgId,
            created_by_org_id: orgId,
            is_active: true
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating perk type:', error);
        if (error.code === '23505') { // Unique violation
            return { data: null, error: 'En förmån med detta namn finns redan' };
        }
        return { data: null, error: 'Kunde inte skapa förmånen' };
    }

    revalidatePath('/staff/formaner');
    return {
        data: {
            ...perkType,
            is_owned: true,
            is_shared: false,
            shared_by_org_name: null,
            user_count: 0,
            room_count: 0,
            course_count: 0
        },
        error: null
    };
}

export async function updatePerkType(id: string, data: Partial<CreatePerkTypeData>): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('perk_types')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating perk type:', error);
        return { success: false, error: 'Kunde inte uppdatera förmånen' };
    }

    revalidatePath('/staff/formaner');
    return { success: true, error: null };
}

export async function deletePerkType(id: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();

    // Check if perk is in use
    const { data: userPerks } = await supabase
        .from('profile_perks')
        .select('id')
        .eq('perk_type_id', id)
        .limit(1);

    if (userPerks && userPerks.length > 0) {
        return { success: false, error: 'Kan inte ta bort en förmån som används av medlemmar' };
    }

    const { error } = await supabase
        .from('perk_types')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting perk type:', error);
        return { success: false, error: 'Kunde inte ta bort förmånen' };
    }

    revalidatePath('/staff/formaner');
    return { success: true, error: null };
}

// ============================
// USER PERK MANAGEMENT
// ============================

export async function getUserPerks(profileId: string): Promise<{ data: UserPerk[] | null; error: string | null }> {
    const supabase = await createClient();

    // Try RPC first, fallback to direct query
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_perks', { p_profile_id: profileId });

    if (!rpcError && rpcData) {
        return { data: rpcData, error: null };
    }

    // Fallback to direct query
    const { data, error } = await supabase
        .from('profile_perks')
        .select(`
      id,
      perk_type_id,
      name,
      description,
      category,
      org_id,
      status,
      source_type,
      granted_at,
      expires_at,
      organizations:org_id(name),
      perk_types:perk_type_id(name, description, category, icon)
    `)
        .eq('profile_id', profileId)
        .order('granted_at', { ascending: false });

    if (error) {
        console.error('Error fetching user perks:', error);
        return { data: null, error: 'Kunde inte hämta användarens förmåner' };
    }

    const mapped = (data || []).map(p => ({
        id: p.id,
        perk_type_id: p.perk_type_id,
        perk_name: (p.perk_types as { name?: string } | null)?.name || p.name || '',
        perk_description: (p.perk_types as { description?: string } | null)?.description || p.description,
        perk_category: (p.perk_types as { category?: string } | null)?.category || p.category,
        perk_icon: (p.perk_types as { icon?: string } | null)?.icon || null,
        org_id: p.org_id,
        org_name: (p.organizations as { name?: string } | null)?.name || '',
        status: p.status,
        source_type: p.source_type || 'manual',
        granted_at: p.granted_at,
        expires_at: p.expires_at,
        granted_by_name: null
    })) as UserPerk[];

    return { data: mapped, error: null };
}

export async function grantPerkToUser(
    profileId: string,
    perkTypeId: string,
    expiresAt?: string
): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const orgId = await getCurrentOrgId();

    if (!user || !orgId) {
        return { success: false, error: 'Inte autentiserad' };
    }

    // Get perk type details
    const { data: perkType, error: perkError } = await supabase
        .from('perk_types')
        .select('*')
        .eq('id', perkTypeId)
        .single();

    if (perkError || !perkType) {
        return { success: false, error: 'Förmånstypen hittades inte' };
    }

    // Check if user already has this perk
    const { data: existingPerk } = await supabase
        .from('profile_perks')
        .select('id')
        .eq('profile_id', profileId)
        .eq('perk_type_id', perkTypeId)
        .eq('status', 'ACTIVE')
        .single();

    if (existingPerk) {
        return { success: false, error: 'Användaren har redan denna förmån' };
    }

    // Grant the perk
    const { error } = await supabase
        .from('profile_perks')
        .insert({
            profile_id: profileId,
            perk_type_id: perkTypeId,
            org_id: orgId,
            source_type: 'manual',
            status: 'ACTIVE',
            granted_by: user.id,
            granted_at: new Date().toISOString(),
            expires_at: expiresAt || null
        });

    if (error) {
        console.error('Error granting perk:', error);
        return { success: false, error: 'Kunde inte tilldela förmånen' };
    }

    revalidatePath('/staff/formaner');
    revalidatePath('/staff/medlemmar');
    return { success: true, error: null };
}

export async function revokeUserPerk(userPerkId: string, reason?: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Inte autentiserad' };
    }

    const { error } = await supabase
        .from('profile_perks')
        .update({
            status: 'REVOKED',
            revoked_at: new Date().toISOString(),
            revoked_by: user.id,
            revoke_reason: reason || null,
            updated_at: new Date().toISOString()
        })
        .eq('id', userPerkId);

    if (error) {
        console.error('Error revoking perk:', error);
        return { success: false, error: 'Kunde inte återkalla förmånen' };
    }

    revalidatePath('/staff/formaner');
    revalidatePath('/staff/medlemmar');
    return { success: true, error: null };
}

// ============================
// MULTI-ORG SHARING
// ============================

export async function getPendingPerkInvites(): Promise<{ data: PerkTypeShare[] | null; error: string | null }> {
    const supabase = await createClient();
    const orgId = await getCurrentOrgId();

    if (!orgId) {
        return { data: null, error: 'Ingen organisation hittades' };
    }

    try {
        // First, get the pending invites without complex joins
        const { data: invites, error: invitesError } = await supabase
            .from('perk_type_organizations')
            .select('*')
            .eq('org_id', orgId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (invitesError) {
            console.error('Error fetching pending invites:', invitesError.message || invitesError.code || 'Unknown error');
            return { data: [], error: null }; // Return empty array instead of error for graceful handling
        }

        if (!invites || invites.length === 0) {
            return { data: [], error: null };
        }

        // Fetch related perk types and organizations for each invite
        const enrichedInvites: PerkTypeShare[] = await Promise.all(
            invites.map(async (invite) => {
                // Get perk type details
                const { data: perkType } = await supabase
                    .from('perk_types')
                    .select('*')
                    .eq('id', invite.perk_type_id)
                    .single();

                // Get inviting org details
                const { data: invitingOrg } = await supabase
                    .from('organizations')
                    .select('id, name')
                    .eq('id', invite.invited_by_org_id)
                    .single();

                return {
                    ...invite,
                    perk_type: perkType || undefined,
                    invited_by_org: invitingOrg || undefined,
                } as PerkTypeShare;
            })
        );

        return { data: enrichedInvites, error: null };
    } catch (err) {
        console.error('Unexpected error in getPendingPerkInvites:', err);
        return { data: [], error: null }; // Return empty array for graceful handling
    }
}

export async function inviteOrgToPerk(perkTypeId: string, targetOrgId: string): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();
    const orgId = await getCurrentOrgId();

    if (!orgId) {
        return { success: false, error: 'Ingen organisation hittades' };
    }

    // Verify we own this perk type
    const { data: perkType } = await supabase
        .from('perk_types')
        .select('created_by_org_id')
        .eq('id', perkTypeId)
        .single();

    if (!perkType || perkType.created_by_org_id !== orgId) {
        return { success: false, error: 'Du kan bara dela förmåner som din organisation har skapat' };
    }

    const { error } = await supabase
        .from('perk_type_organizations')
        .insert({
            perk_type_id: perkTypeId,
            org_id: targetOrgId,
            invited_by_org_id: orgId,
            status: 'pending'
        });

    if (error) {
        console.error('Error inviting org:', error);
        if (error.code === '23505') {
            return { success: false, error: 'Denna organisation har redan bjudits in' };
        }
        return { success: false, error: 'Kunde inte skicka inbjudan' };
    }

    revalidatePath('/staff/formaner');
    return { success: true, error: null };
}

export async function respondToPerkInvite(inviteId: string, accept: boolean): Promise<{ success: boolean; error: string | null }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('perk_type_organizations')
        .update({
            status: accept ? 'active' : 'rejected',
            responded_at: new Date().toISOString()
        })
        .eq('id', inviteId);

    if (error) {
        console.error('Error responding to invite:', error);
        return { success: false, error: 'Kunde inte svara på inbjudan' };
    }

    revalidatePath('/staff/formaner');
    return { success: true, error: null };
}

// ============================
// HELPER FUNCTIONS
// ============================

export async function getOrganizationsList(): Promise<{ data: { id: string; name: string }[] | null; error: string | null }> {
    const supabase = await createClient();
    const orgId = await getCurrentOrgId();

    const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .neq('id', orgId)
        .eq('org_status', 'active')
        .order('name');

    if (error) {
        console.error('Error fetching organizations:', error);
        return { data: null, error: 'Kunde inte hämta organisationer' };
    }

    return { data, error: null };
}

// Get users who have a specific perk type
export async function getPerkTypeUsers(perkTypeId: string): Promise<{ data: { id: string; alias: string; status: string; granted_at: string }[] | null; error: string | null }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profile_perks')
        .select(`
      id,
      status,
      granted_at,
      profiles:profile_id(id, alias)
    `)
        .eq('perk_type_id', perkTypeId)
        .order('granted_at', { ascending: false });

    if (error) {
        console.error('Error fetching perk users:', error);
        return { data: null, error: 'Kunde inte hämta användare' };
    }

    const mapped = (data || []).map(p => ({
        id: p.id,
        alias: (p.profiles as { alias?: string } | null)?.alias || 'Okänd',
        status: p.status,
        granted_at: p.granted_at
    }));

    return { data: mapped, error: null };
}

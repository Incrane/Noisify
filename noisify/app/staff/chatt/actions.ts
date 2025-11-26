'use server';

import { createClient } from "@/utils/supabase/server";

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

import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { getSelectedOrganization } from '../actions'
import { getPerkTypes, getPendingPerkInvites } from './actions'
import { FormanerPageClient } from './formaner-page-client'

export const metadata: Metadata = {
    title: 'Förmåner | Noisify Staff',
    description: 'Hantera förmåner för din organisation'
}

export const revalidate = 60; // Cache for 60 seconds

export default async function FormanerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null;

    // Get Profile & Org IDs
    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) return null;

    const { data: myOrgs } = await supabase.from("org_user").select("org_id, role_id").eq("profile_id", profile.id).gte("role_id", 1);
    const orgIds = myOrgs?.map((o) => o.org_id) || [];

    if (orgIds.length === 0) return <div className="p-8 text-center text-slate-500">Ingen behörighet.</div>;

    // Get Selected Org
    let selectedOrgId = await getSelectedOrganization();

    // If no selected org (cookie empty), default to first available
    if (!selectedOrgId && orgIds.length > 0) {
        selectedOrgId = orgIds[0];
    }

    if (!selectedOrgId) {
        return <div className="p-8 text-center text-slate-500">Ingen organisation vald.</div>;
    }

    // Ensure selectedOrgId is in myOrgs to prevent unauthorized access
    if (!orgIds.includes(selectedOrgId)) {
        return <div className="p-8 text-center text-slate-500">Du har inte behörighet till denna organisation.</div>;
    }

    // Get user's role for this organization
    const userRole = myOrgs?.find(o => o.org_id === selectedOrgId);
    const roleId = userRole?.role_id || 1;

    // Fetch initial data
    const [perkTypesResult, pendingInvitesResult] = await Promise.all([
        getPerkTypes(selectedOrgId),
        getPendingPerkInvites()
    ])

    return (
        <FormanerPageClient
            initialPerkTypes={perkTypesResult.data || []}
            initialPendingInvites={pendingInvitesResult.data || []}
            userRoleId={roleId}
            orgId={selectedOrgId}
        />
    )
}


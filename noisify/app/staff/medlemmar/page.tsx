import { createClient } from "@/utils/supabase/server";
import { getSelectedOrganization } from "../actions";
import { getMembers } from "./actions";
import MembersPageClient from "./members-page-client";

export const revalidate = 0;

export default async function StaffMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get Profile & Org IDs
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return null;

  const { data: myOrgs } = await supabase.from("org_user").select("org_id").eq("profile_id", profile.id).gte("role_id", 1);
  const orgIds = myOrgs?.map((o) => o.org_id) || [];

  if (orgIds.length === 0) return <div className="p-8 text-center text-slate-500">Inga behörighet.</div>;

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

  const params = await searchParams;
  const query = params.q || '';
  const filter = (params.filter as 'all' | 'active' | 'inactive') || 'all';

  const members = await getMembers(selectedOrgId, query, filter);

  // Get org name for breadcrumb/header if needed, but sidebar handles that.
  // Or we can fetch it here to display "Medlemmar för [Org Name]"?
  // The design says "Medlemmar" then "Här visas alla verksamhetens medlemmar."

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            {/* Breadcrumbs could go here: Home / Dashboard / Medlemmar */}
             <div className="text-xs text-slate-500 mb-2">Home / Dashboard / Medlemmar</div>
            <h1 className="text-2xl font-bold text-slate-900">Medlemmar</h1>
            <p className="text-slate-500 text-sm mt-1">Här visas alla verksamhetens medlemmar.</p>
        </div>
      </div>

      <MembersPageClient 
        members={members} 
        orgId={selectedOrgId} 
        filter={filter} 
      />
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { getSelectedOrganization } from "../../actions";
import { getStaff } from "./actions";
import PersonalPageClient from "@/components/staff/personal-page-client";

export const revalidate = 0;

export default async function StaffPersonalPage({
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

  const { data: myOrgs } = await supabase.from("org_user").select("org_id, role_id").eq("profile_id", profile.id).gte("role_id", 1);
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
  const currentOrgUser = myOrgs?.find(o => o.org_id === selectedOrgId);
  if (!currentOrgUser) {
    return <div className="p-8 text-center text-slate-500">Du har inte behörighet till denna organisation.</div>;
  }

  const currentUserRoleId = currentOrgUser.role_id;

  const params = await searchParams;
  const query = params.q || '';
  const filter = (params.filter as 'all' | 'active' | 'inactive') || 'all';

  const staff = await getStaff(selectedOrgId, query, filter);

  return (
    <div className="space-y-6">
      <PersonalPageClient
        staff={staff}
        orgId={selectedOrgId}
        currentUserRoleId={currentUserRoleId}
      />
    </div>
  );
}

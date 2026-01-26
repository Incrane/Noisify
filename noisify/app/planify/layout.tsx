import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getSelectedOrganization } from "@/app/staff/actions";
import PlanifyHeader from "@/components/planify/planify-header";
import Link from "next/link";

export default async function PlanifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, alias")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Check Staff Roles
  const { data: staffOrgs } = await supabase
    .from("org_user")
    .select("role_id, org_id, organizations(id, org_namn, org_status)")
    .eq("profile_id", profile.id)
    .gte("role_id", 1);

  if (!staffOrgs || staffOrgs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Åtkomst nekad</h1>
          <p className="text-slate-600 mb-6">Du har inte behörighet att använda Planify.</p>
          <Link href="/app/aktiviteter" className="px-6 py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors">
            Tillbaka till appen
          </Link>
        </div>
      </div>
    );
  }

  // Check Selected Organization
  const selectedOrgId = await getSelectedOrganization();

  // Validate selection
  const currentOrg = staffOrgs.find(o => o.org_id === selectedOrgId);

  if (!selectedOrgId || !currentOrg) {
    // Redirect to staff to select org
    redirect("/staff");
  }

  const orgDetails = Array.isArray(currentOrg.organizations)
    ? currentOrg.organizations[0]
    : currentOrg.organizations;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-orange-100 selection:text-orange-900">
      <PlanifyHeader
        userAlias={profile.alias || user.email || "User"}
        orgName={orgDetails?.org_namn || "Organization"}
        currentOrgId={selectedOrgId}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

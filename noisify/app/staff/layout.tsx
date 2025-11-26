import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getSelectedOrganization } from "./actions";
import StaffSidebar from "@/components/staff/staff-sidebar";
import StaffHeader from "@/components/staff/staff-header";
import SelectOrgView from "@/components/staff/select-org-view";
import Link from "next/link";

interface StaffOrg {
  role_id: number;
  org_id: string;
  organizations: {
    id: string;
    org_namn: string;
    org_status: 'pending' | 'active' | 'inactive' | 'suspended';
  } | null;
}

export default async function StaffLayout({
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
          <p className="text-slate-600 mb-6">Du har inte behörighet att se personalsidorna.</p>
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
    // Show Selector
    return <SelectOrgView organizations={staffOrgs as unknown as StaffOrg[]} />;
  }

  const isSuperAdmin = staffOrgs.some(o => o.role_id === 5);

  const orgDetails = Array.isArray(currentOrg.organizations)
    ? currentOrg.organizations[0]
    : currentOrg.organizations;

  return (
    <div className="min-h-screen bg-slate-50/50 flex selection:bg-indigo-100 selection:text-indigo-900">
      <StaffSidebar
        userEmail={user.email!}
        alias={profile.alias || undefined}
        orgStatus={orgDetails?.org_status}
        isSuperAdmin={isSuperAdmin}
        currentOrgId={selectedOrgId}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {orgDetails?.org_status === 'pending' && (
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-2 flex items-center justify-center gap-2 text-amber-900">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs font-medium">
              Organisationen väntar på godkännande. Endast grundläggande inställningar är tillgängliga.
            </p>
          </div>
        )}
        <StaffHeader
          organizations={staffOrgs as unknown as StaffOrg[]}
          currentOrgId={selectedOrgId}
          orgStatus={orgDetails?.org_status}
        />
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

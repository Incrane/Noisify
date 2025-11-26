import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ActivityForm from "@/components/staff/activity-form";
import { getSelectedOrganization } from "../../actions";

interface OrgWithDetails {
  org_id: string;
  organizations: {
    id: string;
    org_namn: string;
  } | null;
}

export default async function NewActivityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
  if (!profile) return null;

  // Fetch User's Organizations (for "Samarbete" dropdown or fallback)
  const { data: orgs } = await supabase
    .from('org_user')
    .select('org_id, organizations(id, org_namn)')
    .eq('profile_id', profile.id)
    .gte('role_id', 1);

  if (!orgs || orgs.length === 0) return <div>Ingen behörighet.</div>;

  // Get Selected Org
  const selectedOrgId = await getSelectedOrganization();
  const initialOrgId = selectedOrgId || orgs[0].org_id;

  // Fetch Categories
  const { data: categories } = await supabase.from('categories').select('id, category_name:cat_name');

  // Fetch Target Subgroups
  const { data: targetSubgroups } = await supabase.from('target_subgroups').select('id, subgroup_name');

  // Fetch Staff Members for the initial/selected Org
  const { data: staffData } = await supabase
    .from('org_user')
    .select('profile_id, profiles(alias, public_name)')
    .eq('org_id', initialOrgId);
  
  const staffMembers = staffData?.map((s: any) => ({
      profile_id: s.profile_id,
      alias: s.profiles?.alias,
      public_name: s.profiles?.public_name
  })) || [];

  // Format Orgs for dropdown
  const formattedOrgs = (orgs as unknown as OrgWithDetails[]).map(o => ({
      id: o.org_id,
      org_namn: o.organizations?.org_namn || 'Okänd'
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Ny aktivitet</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <Link href="/staff" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link href="/staff" className="hover:text-slate-900">Dashboard</Link>
            <span>/</span>
            <Link href="/staff/aktiviteter" className="hover:text-slate-900">Aktivitet</Link>
            <span>/</span>
            <span className="font-medium text-slate-900">Ny</span>
        </div>
      </div>

      <ActivityForm 
        organizations={formattedOrgs}
        categories={categories || []}
        targetSubgroups={targetSubgroups || []}
        staffMembers={staffMembers}
        initialOrgId={initialOrgId}
      />
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ActivityForm from "@/components/staff/activity-form";
import { getSelectedOrganization } from "../../../actions";

interface OrgWithDetails {
  org_id: string;
  organizations: {
    id: string;
    org_namn: string;
  } | null;
}

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
  if (!profile) return null;

  // Fetch Activity
  const { data: activity } = await supabase
    .from("activity_dashboard")
    .select("*")
    .eq("activity_id", id)
    .single();

  if (!activity) return <div>Aktiviteten hittades inte.</div>;

  // Check Permissions (using the same RPC as detail page)
  const { data: hasPermission } = await supabase.rpc('is_activity_org_staff', {
    p_activity_id: id,
    p_user_id: user.id
  });

  if (!hasPermission) return <div>Ingen behörighet.</div>;

  // Fetch User's Organizations (for "Samarbete" dropdown or fallback)
  const { data: orgs } = await supabase
    .from('org_user')
    .select('org_id, organizations(id, org_namn)')
    .eq('profile_id', profile.id)
    .gte('role_id', 1);

  if (!orgs || orgs.length === 0) return <div>Ingen behörighet.</div>;

  // Fetch Categories
  const { data: categories } = await supabase.from('categories').select('id, category_name:cat_name');

  // Fetch Target Subgroups
  const { data: targetSubgroups } = await supabase.from('target_subgroups').select('id, subgroup_name');

  // Fetch Staff Members for the activity's org
  const { data: staffData } = await supabase
    .from('org_user')
    .select('profile_id, profiles(alias, public_name)')
    .eq('org_id', activity.agande_org_id);

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
        <h1 className="text-2xl font-bold text-slate-900">Redigera aktivitet</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <Link href="/staff" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/staff" className="hover:text-slate-900">Dashboard</Link>
          <span>/</span>
          <Link href="/staff/aktiviteter" className="hover:text-slate-900">Aktivitet</Link>
          <span>/</span>
          <span className="font-medium text-slate-900">{activity.aktivitet}</span>
        </div>
      </div>

      <ActivityForm
        organizations={formattedOrgs}
        categories={categories || []}
        targetSubgroups={targetSubgroups || []}
        staffMembers={staffMembers}
        initialOrgId={activity.agande_org_id}
        initialData={activity}
      />
    </div>
  );
}

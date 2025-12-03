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

  // Fetch Activity (using activity_dashboard for base info, but also fetching raw activity for new fields if view is outdated)
  // Actually, let's fetch from 'activity' table directly to be safe and get all new columns
  const { data: activity } = await supabase
    .from("activity")
    .select(`
      *,
      owner_org:organizations(org_namn),
      categories:activity_categories(category_id),
      target_subgroups:activity_target_subgroups(sub_group_id),
      genders:activity_gender(gender_id),
      collaborators:activity_organisation(org_id)
    `)
    .eq("id", id)
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

  // Fetch Genders
  const { data: genders } = await supabase.from('gender').select('id, gender');

  // Fetch Staff Members for the activity's org
  const { data: staffData } = await supabase
    .from('org_user')
    .select('profile_id, profiles(alias, public_name)')
    .eq('org_id', activity.owner_org_id);

  const staffMembers = staffData?.map((s: any) => ({
    profile_id: s.profile_id,
    alias: s.profiles?.alias,
    public_name: s.profiles?.public_name
  })) || [];

  // Fetch ALL organizations for address lookup and collaboration
  const { data: rawOrganizations, error: orgError } = await supabase
    .from('organizations')
    .select('id, org_namn, adress, city_id');

  if (orgError) console.error('Error fetching orgs:', orgError);

  const allOrganizations = rawOrganizations?.map((org: any) => ({
    id: org.id,
    org_namn: org.org_namn,
    address: org.adress, // Map DB 'adress' to component 'address'
    city_id: org.city_id
  })) || [];


  // Format Orgs for dropdown
  const formattedOrgs = (orgs as unknown as OrgWithDetails[]).map(o => ({
    id: o.org_id,
    org_namn: o.organizations?.org_namn || 'Okänd'
  }));

  // Prepare Initial Data
  // We need to map the fetched data to ActivityInitialData interface
  // activity_dashboard view had different column names (e.g. 'aktivitet' vs 'name', 'start_datum_tid' vs 'starts_at')
  // ActivityForm expects ActivityInitialData which uses the VIEW's column names (Swedish).
  // I should probably update ActivityForm to use English column names to match the table, OR map them here.
  // Mapping is safer to avoid breaking ActivityForm if I missed something.

  const initialData = {
    activity_id: activity.id,
    aktivitet: activity.name,
    beskrivning: activity.description,
    owner_org_id: activity.owner_org_id,
    start_datum_tid: activity.starts_at,
    slut_datum_tid: activity.ends_at,
    total_kapacitet: activity.capacity,
    plats: activity.address,
    category_id: activity.categories?.[0]?.category_id || '', // Legacy fallback
    target_subgroups: activity.target_subgroups?.map((ts: any) => ts.sub_group_id) || [],
    created_by: activity.created_by,
    image_url: activity.image_url,
    reservplatser: activity.reserve_capacity,
    anmalningsfrist: activity.registration_deadline,
    min_age: activity.age_min,
    max_age: activity.age_max,
    activity_type: activity.activity_type,
    lottery_date: activity.lottery_date,
    confirmation_deadline: activity.confirmation_deadline,
    genders: activity.genders?.map((g: any) => g.gender_id) || [],
    rrule: activity.rrule,
    registreringsregler: activity.registration_rules,
    collaborators: activity.collaborators?.map((c: any) => c.org_id) || [],
    hide_address: activity.hide_address
  };

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
          <span className="font-medium text-slate-900">{activity.name}</span>
        </div>
      </div>

      <ActivityForm
        organizations={formattedOrgs}
        categories={categories || []}
        targetSubgroups={targetSubgroups || []}
        staffMembers={staffMembers}
        initialOrgId={activity.owner_org_id}
        initialData={initialData}
        allOrganizations={allOrganizations || []}
        genders={genders || []}
      />
    </div>
  );
}

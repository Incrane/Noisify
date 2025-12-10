import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CourseForm from "@/components/staff/course-form";
import { getSelectedOrganization } from "../../actions";

interface Instructor {
  id: string;
  name: string;
  title: string | null;
  image_url: string | null;
  is_external?: boolean;
}

interface Tag {
  id: string;
  name: string;
}

interface StaffRow {
  role_id: number;
  profile: {
    id: string;
    alias: string | null;
  };
}

interface MemberRow {
  profile: {
    id: string;
    alias: string | null;
  };
}

interface Perk {
  id: string;
  name: string;
}

export default async function NewCoursePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
  if (!profile) return null;

  // Fetch User's Organizations (Must be Staff/Role >= 2 to create courses)
  let orgs: { org_id: string; organizations: { id: string; org_namn: string; } | { id: string; org_namn: string; }[] | null; }[] = [];
  try {
    const { data, error } = await supabase
      .from('org_user')
      .select('org_id, organizations(id, org_namn)')
      .eq('profile_id', profile.id)
      .gte('role_id', 2);
    if (error) console.error('Error fetching orgs:', error);
    orgs = data || [];
  } catch (e) {
    console.error('Exception fetching orgs:', e);
  }

  if (!orgs || orgs.length === 0) return <div>Ingen behörighet att skapa kurser (kräver personal-roll).</div>;

  // Get Selected Org
  const selectedOrgId = await getSelectedOrganization();
  // Validate selectedOrgId exists in user's orgs
  const isSelectedOrgValid = orgs.some(o => o.org_id === selectedOrgId);
  const initialOrgId = (isSelectedOrgValid && selectedOrgId) ? selectedOrgId : orgs[0].org_id;

  // Fetch Available Instructors (Fetch all from instructors table for now)
  let availableInstructors: Instructor[] = [];
  try {
    const { data: instructorsData, error } = await supabase
      .from('instructors')
      .select('id, name, title, image_url');
    if (error) console.error('Error fetching instructors:', error);
    availableInstructors = instructorsData?.map(i => ({ ...i, is_external: true })) || [];
  } catch (e) {
    console.error('Exception fetching instructors:', e);
  }

  // Fetch Available Tags
  let availableTags: Tag[] = [];
  try {
    const { data: tagsData, error } = await supabase.from('tags').select('id, name');
    if (error) console.error('Error fetching tags:', error);
    availableTags = tagsData || [];
  } catch (e) {
    console.error('Exception fetching tags:', e);
  }

  // Fetch Organization Staff
  let organizationStaff: Instructor[] = [];
  try {
    const { data: staffData, error } = await supabase
      .from('org_user')
      .select(`
          role_id,
          profile:profiles!inner (
              id,
              alias
          )
      `)
      .eq('org_id', initialOrgId)
      .gte('role_id', 1);

    if (error) console.error('Error fetching staff:', error);

    // Transform staff data to Instructor interface format
    organizationStaff = (staffData as StaffRow[] | null)?.map((s) => ({
      id: s.profile.id,
      name: s.profile.alias || 'Okänd',
      title: s.role_id >= 2 ? 'Personal' : 'Assistent',
      image_url: null,
      is_external: false
    })) || [];
  } catch (e) {
    console.error('Exception fetching staff:', e);
  }

  // Fetch All Organization Members (for member selection)
  let organizationMembers: { id: string, name: string }[] = [];
  try {
    const { data: membersData, error } = await supabase
      .from('org_user')
      .select(`
          profile:profiles!inner (
              id,
              alias
          )
      `)
      .eq('org_id', initialOrgId)
      .in('status', ['aktiv', 'onboarding']);

    if (error) console.error('Error fetching members:', error);

    organizationMembers = (membersData as MemberRow[] | null)?.map((m) => ({
      id: m.profile.id,
      name: m.profile.alias || 'Okänd'
    })) || [];
  } catch (e) {
    console.error('Exception fetching members:', e);
  }

  // Fetch Available Perks for perk grant on completion
  let availablePerks: Perk[] = [];
  try {
    const { data: perksData, error } = await supabase
      .from('perk_types')
      .select('id, name')
      .eq('org_id', initialOrgId)
      .eq('is_active', true)
      .order('name');
    if (error) console.error('Error fetching perks:', error);
    availablePerks = perksData || [];
  } catch (e) {
    console.error('Exception fetching perks:', e);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Ny kurs</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <Link href="/staff" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/staff/kurser" className="hover:text-slate-900">Kurser</Link>
          <span>/</span>
          <span className="font-medium text-slate-900">Ny</span>
        </div>
      </div>

      <CourseForm
        initialOrgId={initialOrgId}
        availableInstructors={availableInstructors}
        organizationStaff={organizationStaff}
        availableTags={availableTags}
        organizationMembers={organizationMembers}
        availablePerks={availablePerks}
      />
    </div>
  );
}

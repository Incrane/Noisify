import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CourseForm from "@/components/staff/course-form";

interface CourseData {
  id: string;
  name: string;
  description?: string;
  short_description?: string;
  duration_hours?: string;
  image_url?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  access_level: 'OPEN_FOR_ALL' | 'ONLY_MEMBERS' | 'SELECTED_MEMBERS';
  owner_org_id: string;
}

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

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  duration_minutes: number;
}

interface MemberRow {
  profile: {
    id: string;
    alias: string | null;
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
  if (!profile) return null;

  // Fetch Course
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !course) {
    return <div>Kursen hittades inte.</div>;
  }

  // Verify Access
  const { data: hasAccess } = await supabase
    .from('org_user')
    .select('role_id')
    .eq('profile_id', profile.id)
    .eq('org_id', course.owner_org_id)
    .gte('role_id', 1)
    .single();

  if (!hasAccess) return <div>Ingen behörighet att redigera denna kurs.</div>;

  // Fetch Available Instructors
  const { data: instructorsData } = await supabase
    .from('instructors')
    .select('id, name, title, image_url');
  const availableInstructors: Instructor[] = instructorsData?.map(i => ({ ...i, is_external: true })) || [];

  // Fetch Available Tags
  const { data: tagsData } = await supabase.from('tags').select('id, name');
  const availableTags: Tag[] = tagsData || [];

  // Fetch Linked Instructors
  const { data: linkedInstructors } = await supabase
    .from('course_instructors')
    .select('instructor_id')
    .eq('course_id', id)
    .order('sort_order');
  const initialInstructorIds = linkedInstructors?.map(i => i.instructor_id) || [];

  // Fetch Linked Tags
  const { data: linkedTags } = await supabase
    .from('course_tags')
    .select('tag_id')
    .eq('course_id', id);
  const initialTagIds = linkedTags?.map(t => t.tag_id) || [];

  // Fetch Modules and Lessons
  // 1. Fetch modules
  const { data: modulesData } = await supabase
    .from('course_modules')
    .select('id, title, description, sort_order')
    .eq('course_id', id)
    .order('sort_order');

  const modules: Module[] = modulesData?.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description || '',
    lessons: []
  })) || [];

  // 2. Fetch lessons if we have modules
  if (modules.length > 0) {
    const moduleIds = modules.map(m => m.id);
    const { data: lessonsData } = await supabase
      .from('course_lessons')
      .select('id, module_id, title, duration_minutes, sort_order')
      .in('module_id', moduleIds)
      .order('sort_order');

    if (lessonsData) {
      lessonsData.forEach(l => {
        const mod = modules.find(m => m.id === l.module_id);
        if (mod) {
          mod.lessons.push({
            id: l.id,
            title: l.title,
            duration_minutes: l.duration_minutes || 0
          });
        }
      });
    }
  }

  // Fetch All Organization Members (for member selection)
  let organizationMembers: { id: string, name: string }[] = []
  try {
    const { data: membersData, error } = await supabase
      .from('org_user')
      .select(`
          profile:profiles!inner (
              id,
              alias
          )
      `)
      .eq('org_id', course.owner_org_id)
      .in('status', ['aktiv', 'onboarding']);

    if (error) console.error('Error fetching members:', error);

    organizationMembers = (membersData as MemberRow[] | null)?.map((m) => ({
      id: m.profile.id,
      name: m.profile.alias || 'Okänd'
    })) || [];
  } catch (e) {
    console.error('Exception fetching members:', e);
  }

  // Fetch Selected Members (if access level is SELECTED_MEMBERS)
  let selectedMemberIds: string[] = []
  if (course.access_level === 'SELECTED_MEMBERS') {
    try {
      const { data: selectedMembers } = await supabase
        .from('course_members')
        .select('profile_id')
        .eq('course_id', id);
      selectedMemberIds = selectedMembers?.map(m => m.profile_id) || [];
    } catch (e) {
      console.error('Error fetching selected members:', e);
    }
  }

  // Cast course data
  const courseData: CourseData = {
    ...course,
    description: course.description || '',
    short_description: course.short_description || '',
    duration_hours: course.duration_hours || '',
    image_url: course.image_url || '',
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Hantera Kurs: {course.name}</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <Link href="/staff" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/staff/kurser" className="hover:text-slate-900">Kurser</Link>
          <span>/</span>
          <span className="font-medium text-slate-900">{course.name}</span>
        </div>
      </div>

      <CourseForm
        initialData={courseData}
        initialOrgId={course.owner_org_id}
        availableInstructors={availableInstructors}
        availableTags={availableTags}
        organizationMembers={organizationMembers}
        initialInstructorIds={initialInstructorIds}
        initialTagIds={initialTagIds}
        initialModules={modules}
        initialSelectedMemberIds={selectedMemberIds}
      />
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import CourseListClient from "@/components/staff/course-list-client";

export const revalidate = 60; // Cache for 60 seconds

export default async function StaffCoursesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get Profile & Org IDs
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return null;

  const { data: myOrgs } = await supabase.from("org_user").select("org_id").eq("profile_id", profile.id).gte("role_id", 1);
  const orgIds = myOrgs?.map((o) => o.org_id) || [];

  if (orgIds.length === 0) return <div>Inga behörighet.</div>;

  // Fetch Courses
  const { data: courses } = await supabase
    .from("course_dashboard")
    .select("*")
    .in("agande_org_id", orgIds)
    .order("skapad_datum", { ascending: false });

  return <CourseListClient initialCourses={courses || []} />;
}

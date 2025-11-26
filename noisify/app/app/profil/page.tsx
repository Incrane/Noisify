import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { StatsHeader } from "@/components/profile/stats-header";
import { MembershipCardStack } from "@/components/profile/membership-card-stack";
import { QuickAccessMenu } from "@/components/profile/quick-access-menu";
import { InterestsSummary } from "@/components/profile/interests-summary";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("v_user_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    // Handle case where profile doesn't exist yet
    return (
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Profil saknas</h1>
        <p>Vi kunde inte hitta din profil. Kontakta supporten.</p>
        <form action={async () => {
          "use server";
          const supabase = await createClient();
          await supabase.auth.signOut();
          redirect("/");
        }}>
          <button type="submit" className="mt-4 text-blue-600 hover:underline">Logga ut</button>
        </form>
      </div>
    );
  }

  // Fetch memberships
  const { data: memberships } = await supabase
    .from("members_dashboard")
    .select("*")
    .eq("profile_id", profile.profile_id)
    .order("membership_state", { ascending: true });

  // Fetch interests
  const { data: interests } = await supabase
    .from("profile_interests")
    .select(`
      id,
      categories (
        cat_name,
        color,
        bg_color
      )
    `)
    .eq("profile_id", profile.profile_id);

  // Flatten interests data
  const formattedInterests = interests?.map((i: any) => ({
    id: i.id,
    cat_name: i.categories?.cat_name,
    color: i.categories?.color,
    bg_color: i.categories?.bg_color,
  })) || [];

  const handleLogout = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <StatsHeader profile={profile || {}} />

      {/* Memberships Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 px-1">Mina Medlemskap</h2>
        <MembershipCardStack memberships={memberships || []} />
      </div>

      {/* Interests Section */}
      <InterestsSummary interests={formattedInterests} />

      {/* Quick Access Menu */}
      <QuickAccessMenu onLogout={handleLogout} />
    </div>
  );
}

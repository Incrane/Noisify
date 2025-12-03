import { createClient } from "@/utils/supabase/server";
import ActivityCard from "@/components/activity-card";
import InvitationBanner from "@/components/invitation-banner";
import ActivityListRow from "@/components/activity-list-row";
import DashboardFavorites from "@/components/dashboard-favorites";

export const revalidate = 0; // Ensure dynamic data

interface RegistrationStatus {
  activity_id: string;
  status: string;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get User Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  // 2. Fetch Activities (Published) from Dashboard View
  const { data: activities, error } = await supabase
    .from("activity_dashboard")
    .select("*")
    .eq("activity_status", "PUBLISHED")
    .gt("slut_datum_tid", new Date().toISOString())
    .order("start_datum_tid", { ascending: true });

  if (error) {
    console.error("Error fetching activities:", error);
    return <div>Kunde inte ladda aktiviteter.</div>;
  }

  // Filter activities based on search query
  const query = typeof searchParams.q === 'string' ? searchParams.q.toLowerCase() : '';

  const filteredActivities = activities?.filter(activity => {
    if (!query) return true;
    const nameMatch = activity.name?.toLowerCase().includes(query);
    const orgMatch = activity.org_namn?.toLowerCase().includes(query);
    return nameMatch || orgMatch;
  }) || [];

  // 3. Fetch User Registrations
  let myRegistrations: RegistrationStatus[] = [];
  const favoriteIds = new Set<string>();

  if (profile) {
    const [regsResult, favsResult] = await Promise.all([
      supabase
        .from("registration")
        .select("activity_id, status")
        .eq("profile_id", profile.id),
      supabase
        .from("activity_favorites")
        .select("activity_id")
        .eq("profile_id", profile.id)
    ]);

    if (regsResult.data) {
      myRegistrations = regsResult.data as unknown as RegistrationStatus[];
    }

    if (favsResult.data) {
      favsResult.data.forEach((f: { activity_id: string }) => favoriteIds.add(f.activity_id));
    }
  }

  const getRegistrationStatus = (activityId: string) => {
    const reg = myRegistrations.find((r) => r.activity_id === activityId);
    return reg ? reg.status : null;
  };

  // 4. Calculate Stats & Lists
  const invitationCount = myRegistrations.filter((r) => r.status === "INVITED").length;

  const myUpcomingActivities = activities
    ?.filter((activity) => {
      const status = getRegistrationStatus(activity.activity_id);
      if (!status) return false;
      // Include confirmed, pending, invited, waitlisted
      const isRelevant = ["ACCEPTED", "PENDING", "WAITLISTED", "INVITED"].includes(status);
      // Check if future
      const isFuture = new Date(activity.slut_datum_tid || activity.start_datum_tid) > new Date();

      return isRelevant && isFuture;
    })
    .slice(0, 3) || [];

  const favoriteActivities = activities?.filter(a => favoriteIds.has(a.activity_id)) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Section: Banner & My Upcoming */}
      <div className="space-y-6">
        <InvitationBanner count={invitationCount} href="/app/mina-anmalningar?tab=inbjudningar" />

        {myUpcomingActivities.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Mina närmaste aktiviteter</h2>
            <div className="space-y-4">
              {myUpcomingActivities.map((activity) => (
                <ActivityListRow
                  key={activity.activity_id}
                  activity={activity}
                  registrationStatus={getRegistrationStatus(activity.activity_id)}
                  href={`/app/aktiviteter/${activity.activity_id}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* All Activities Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Alla aktiviteter</h2>
          <div className="flex gap-2">
            {/* Future: Filters */}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
            const myStatus = getRegistrationStatus(activity.activity_id);
            const isFav = favoriteIds.has(activity.activity_id);

            return (
              <ActivityCard
                key={activity.activity_id}
                activity={activity}
                registrationStatus={myStatus}
                isFavorite={isFav}
                href={`/app/aktiviteter/${activity.activity_id}`}
              />
            );
          })}

          {filteredActivities.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              Inga aktiviteter hittades.
            </div>
          )}
        </div>
      </section>

      {/* Favorites Section */}
      <DashboardFavorites favorites={favoriteActivities} />
    </div>
  );
}


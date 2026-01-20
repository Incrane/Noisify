import { createClient } from "@/utils/supabase/server";
import ActivityCard from "@/components/activity-card";
import InvitationBanner from "@/components/invitation-banner";
import ActivityListRow from "@/components/activity-list-row";
import DashboardFavorites from "@/components/dashboard-favorites";

export const revalidate = 60; // Cache for 60 seconds

interface RegistrationStatus {
  activity_id: string;
  status: string;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get User Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, city_id")
    .eq("user_id", user.id)
    .single();

  // 2. Fetch Activities (Published) from Dashboard View
  // 2. Fetch Activities (Published) from Member View
  let activitiesQuery = supabase
    .from("v_member_activities")
    .select("*")
    .eq("activity_status", "PUBLISHED")
    .gt("slut_datum_tid", new Date().toISOString())
    .order("start_datum_tid", { ascending: true });

  if (profile?.city_id) {
    activitiesQuery = activitiesQuery.eq("city_id", profile.city_id);
  }

  const { data: activities, error } = await activitiesQuery;

  if (error) {
    console.error("Error fetching activities:", error);
    return <div>Kunde inte ladda aktiviteter.</div>;
  }

  // Filter activities based on search query
  const query = typeof params.q === 'string' ? params.q.toLowerCase() : '';



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

  // 3b. Fetch full addresses for accepted activities
  const acceptedActivityIds = myRegistrations
    .filter(r => r.status === 'ACCEPTED')
    .map(r => r.activity_id);

  const activitiesWithHiddenAddress = activities?.filter(a =>
    acceptedActivityIds.includes(a.activity_id) && a.hide_address
  ) || [];

  let addressMap = new Map<string, string>();

  if (activitiesWithHiddenAddress.length > 0) {
    const { data: addresses } = await supabase
      .from("activity")
      .select("id, address")
      .in("id", activitiesWithHiddenAddress.map(a => a.activity_id));

    if (addresses) {
      addresses.forEach(a => addressMap.set(a.id, a.address));
    }
  }

  // Merge addresses back into activities
  const activitiesWithAddresses = activities?.map(activity => {
    if (addressMap.has(activity.activity_id)) {
      return {
        ...activity,
        plats: addressMap.get(activity.activity_id)
      };
    }
    return activity;
  }) || [];

  // Update references to use the merged array
  // Update references to use the merged array
  const filteredActivities = activitiesWithAddresses.filter(activity => {
    if (!query) return true;
    const nameMatch = activity.aktivitet?.toLowerCase().includes(query); // Note: View uses 'aktivitet' alias for name
    const orgMatch = activity.agande_organisation?.toLowerCase().includes(query); // View uses 'agande_organisation'
    return nameMatch || orgMatch;
  });

  // 4. Calculate Stats & Lists
  const invitationCount = myRegistrations.filter((r) => r.status === "INVITED").length;

  const myUpcomingActivities = activitiesWithAddresses
    .filter((activity) => {
      const status = getRegistrationStatus(activity.activity_id);
      if (!status) return false;
      // Include confirmed, pending, invited, waitlisted
      const isRelevant = ["ACCEPTED", "PENDING", "WAITLISTED", "INVITED"].includes(status);
      // Check if future
      const isFuture = new Date(activity.slut_datum_tid || activity.start_datum_tid) > new Date();

      return isRelevant && isFuture;
    })
    .slice(0, 3);

  const favoriteActivities = activitiesWithAddresses.filter(a => favoriteIds.has(a.activity_id));

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


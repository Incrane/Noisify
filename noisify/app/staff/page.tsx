import { createClient } from "@/utils/supabase/server";
import { Calendar, Users, ClipboardCheck, ArrowRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function StaffDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, alias")
    .eq("user_id", user.id)
    .single();

  if (!profile) return null;

  // Get Org IDs where user is staff
  const { data: myOrgs } = await supabase
    .from("org_user")
    .select("org_id")
    .eq("profile_id", profile.id)
    .gte("role_id", 1);

  const orgIds = myOrgs?.map((o) => o.org_id) || [];

  if (orgIds.length === 0) {
    return <div>Inga organisationer hittades.</div>;
  }

  // Helper dates
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Fetch Metrics & Data
  const [
    { count: pendingCount },
    { count: upcomingCount },
    { count: memberCount },
    { data: todaysActivitiesRaw },
    { data: todaysBookingsRaw },
    { data: recentActivities }
  ] = await Promise.all([
    // 1. Pending Registrations
    supabase
      .from("registration")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING")
      .in(
        "activity_id",
        (
          await supabase
            .from("activity")
            .select("activity_id")
            .in("owner_org_id", orgIds)
        ).data?.map((a) => a.activity_id) || []
      ),

    // 2. Upcoming Activities (Future)
    supabase
      .from("activity")
      .select("*", { count: "exact", head: true })
      .in("owner_org_id", orgIds)
      .gte("starts_at", now.toISOString())
      .neq("status", "ARCHIVED"),

    // 3. Total Members
    supabase
      .from("org_user")
      .select("*", { count: "exact", head: true })
      .in("org_id", orgIds)
      .eq("role_id", 0), // 0 = Member

    // 4. Today's Activities
    supabase
      .from("activity")
      .select("activity_id, name, starts_at, ends_at, location, room_id")
      .in("owner_org_id", orgIds)
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString())
      .neq("status", "ARCHIVED")
      .order("starts_at", { ascending: true }),

    // 5. Today's Room Bookings
    supabase
      .from("room_bookings")
      .select(`
        id,
        start_time,
        end_time,
        status,
        rooms!inner (
            name,
            org_id
        ),
        profiles (
            alias
        )
      `)
      .in("rooms.org_id", orgIds)
      .gte("start_time", todayStart.toISOString())
      .lte("start_time", todayEnd.toISOString())
      .neq("status", "CANCELLED"),

    // 6. Recent Activities (for list)
    supabase
      .from("activity")
      .select("activity_id, name, starts_at, status, capacity")
      .in("owner_org_id", orgIds)
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  // Combine and sort today's events
  const todaysEvents = [
    ...(todaysActivitiesRaw || []).map(a => ({
      id: a.activity_id,
      type: 'activity',
      title: a.name,
      start: a.starts_at,
      end: a.ends_at,
      location: a.location || (a.room_id ? 'Bokat rum' : 'Plats ej angiven'),
      link: `/staff/aktiviteter/${a.activity_id}`,
      status: 'active',
      organizer: null
    })),
    ...(todaysBookingsRaw || []).map(b => {
      // Handle Supabase join potentially returning array
      // @ts-expect-error - Supabase types might not infer single object correctly
      const roomName = b.rooms?.name || (Array.isArray(b.rooms) ? b.rooms[0]?.name : 'Okänt rum');
      // @ts-expect-error - Supabase types might not infer single object correctly
      const organizerAlias = b.profiles?.alias || (Array.isArray(b.profiles) ? b.profiles[0]?.alias : 'Okänd');

      return {
        id: b.id,
        type: 'booking',
        title: `Bokning: ${roomName}`,
        start: b.start_time,
        end: b.end_time,
        location: roomName,
        link: `/staff/rum/${b.id}`, // Assuming route exists or just /staff/rum
        status: b.status,
        organizer: organizerAlias
      };
    })
  ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Hej {profile.alias || "Personal"}! 👋
        </h1>
        <p className="text-slate-500 text-lg">Här är en översikt över vad som händer i verksamheten.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Today */}
        <div className="lg:col-span-2 space-y-8">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 font-medium text-sm">Väntande anmälningar</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>
              <span className="text-3xl font-bold text-slate-900">{pendingCount || 0}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 font-medium text-sm">Kommande aktiviteter</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <span className="text-3xl font-bold text-slate-900">{upcomingCount || 0}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 font-medium text-sm">Totalt antal medlemmar</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <span className="text-3xl font-bold text-slate-900">{memberCount || 0}</span>
            </div>
          </div>

          {/* Today's Activities & Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="font-bold text-slate-900 text-lg">Händer idag</h2>
              </div>
              <span className="text-sm text-slate-500 font-medium">
                {new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {todaysEvents.length > 0 ? (
                todaysEvents.map((event) => (
                  <div key={`${event.type}-${event.id}`} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-start gap-4">
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border 
                        ${event.type === 'activity'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                        <span className="text-xs font-bold uppercase">{new Date(event.start).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{event.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(event.start).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </span>
                          )}
                          {event.organizer && (
                            <span className="flex items-center gap-1 text-slate-400">
                              • {event.organizer}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {event.link && (
                      <Link
                        href={event.link}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>Inget planerat idag.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <h2 className="font-bold text-slate-900 text-lg">Senast skapade</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {recentActivities?.map((activity) => (
                <div key={activity.activity_id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-slate-900 text-sm line-clamp-1">{activity.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                      ${activity.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                        activity.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
                      {activity.status === 'PUBLISHED' ? 'Publ' : activity.status === 'DRAFT' ? 'Utkast' : 'Arkiv'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {new Date(activity.starts_at).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })}
                  </p>
                  <Link
                    href={`/staff/aktiviteter/${activity.activity_id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    Hantera aktivitet →
                  </Link>
                </div>
              ))}
              {recentActivities?.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-sm">
                  Inga aktiviteter än.
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/30">
              <Link href="/staff/aktiviteter" className="block w-full text-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                Visa alla aktiviteter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

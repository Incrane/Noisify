import { createClient } from "@/utils/supabase/server";
import { Users, Calendar, TrendingUp, BarChart3, UserCheck, UserPlus, Clock, ClipboardCheck } from "lucide-react";

export const revalidate = 0;

export default async function StatisticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
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
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Inga organisationer hittades</h2>
        <p className="text-slate-500 mt-2">Du måste vara personal på minst en organisation för att se statistik.</p>
      </div>
    );
  }

  // Fetch Data
  const [
    { count: totalMembers },
    { count: totalActivities },
    { count: publishedActivities },
    { count: totalRegistrations },
    { count: waitlistedRegistrations },
    { count: pendingRegistrations },
    { count: roomBookingsCount },
    { count: activeCoursesCount },
    { data: popularActivities }
  ] = await Promise.all([
    // 1. Total Members
    supabase
      .from("org_user")
      .select("*", { count: "exact", head: true })
      .in("org_id", orgIds)
      .eq("role_id", 0),

    // 2. Total Activities
    supabase
      .from("activity")
      .select("*", { count: "exact", head: true })
      .in("org_id", orgIds),

    // 3. Published Activities
    supabase
      .from("activity")
      .select("*", { count: "exact", head: true })
      .in("org_id", orgIds)
      .eq("status", "PUBLISHED"),

    // 4. Total Registrations (across all owned activities)
    supabase
      .from("registration")
      .select("*", { count: "exact", head: true })
      .in(
        "activity_id",
        (await supabase.from("activity").select("activity_id").in("org_id", orgIds)).data?.map(a => a.activity_id) || []
      ),

    // 6. Waitlisted Registrations
    supabase
      .from("registration")
      .select("*", { count: "exact", head: true })
      .eq("status", "WAITLISTED")
      .in(
        "activity_id",
        (await supabase.from("activity").select("activity_id").in("org_id", orgIds)).data?.map(a => a.activity_id) || []
      ),

    // 7. Pending Registrations
    supabase
      .from("registration")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING")
      .in(
        "activity_id",
        (await supabase.from("activity").select("activity_id").in("org_id", orgIds)).data?.map(a => a.activity_id) || []
      ),

    // 8. Room Bookings
    supabase
      .from("room_bookings")
      .select("id, rooms!inner(org_id)", { count: "exact", head: true })
      .in("rooms.org_id", orgIds)
      .neq("status", "CANCELLED"),

    // 9. Active Courses
    supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .in("owner_org_id", orgIds)
      .eq("status", "PUBLISHED"),

    // 10. Most Popular Activities
    supabase
      .from("activity_dashboard")
      .select("activity_id, aktivitet, totala_anmalningar, datum, activity_status")
      .in("agande_org_id", orgIds)
      .order("totala_anmalningar", { ascending: false })
      .limit(5)
  ]);

  const kpiCards = [
    {
      title: "Totalt antal medlemmar",
      value: totalMembers || 0,
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      description: "Registrerade medlemmar"
    },
    {
      title: "Väntande anmälningar",
      value: pendingRegistrations || 0,
      icon: ClipboardCheck,
      color: "bg-amber-50 text-amber-600",
      description: "Behöver godkännas"
    },
    {
      title: "Totala anmälningar",
      value: totalRegistrations || 0,
      icon: UserPlus,
      color: "bg-blue-50 text-blue-600",
      description: "Genom tiderna"
    },
    {
      title: "Publicerade aktiviteter",
      value: publishedActivities || 0,
      icon: Calendar,
      color: "bg-indigo-50 text-indigo-600",
      description: `Av ${totalActivities} skapade`
    },
    {
      title: "Aktiva kurser",
      value: activeCoursesCount || 0,
      icon: TrendingUp,
      color: "bg-pink-50 text-pink-600",
      description: "Publicerade kurser"
    },
    {
      title: "Rumsbokningar",
      value: roomBookingsCount || 0,
      icon: UserCheck, // Reusing icon or import DoorOpen if available, but using UserCheck for now
      color: "bg-purple-50 text-purple-600",
      description: "Totalt antal bokningar"
    }
  ];

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Statistik</h1>
        <p className="text-slate-500 text-lg">Översikt och insikter för din verksamhet.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              {/* Optional trend indicator could go here */}
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-slate-900">{card.value}</h3>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <p className="text-xs text-slate-400">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Popular Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-900 text-lg">Populäraste aktiviteterna</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {popularActivities && popularActivities.length > 0 ? (
              popularActivities.map((activity) => (
                <div key={activity.activity_id} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div>
                    <h3 className="font-semibold text-slate-900">{activity.aktivitet}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {activity.datum} • <span className={activity.activity_status === 'PUBLISHED' ? 'text-emerald-600' : 'text-slate-400'}>
                        {activity.activity_status === 'PUBLISHED' ? 'Publicerad' : 'Utkast/Arkiverad'}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-xl font-bold text-slate-900">{activity.totala_anmalningar}</span>
                      <span className="text-xs text-slate-500">anmälningar</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">Ingen data tillgänglig än.</div>
            )}
          </div>
        </div>

        {/* Registration Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-900 text-lg">Anmälningsstatus</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">Fyllnadsgrad (Genomsnitt)</span>
                <span className="text-slate-900">--%</span> 
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-0 rounded-full" />
              </div>
              <p className="text-xs text-slate-400 text-right">Beräknas på aktiviteter med kapacitetstak</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-amber-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">På kö</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">{waitlistedRegistrations || 0}</span>
                <p className="text-xs text-slate-500">personer väntar på plats</p>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Snitt per aktivitet</span>
                </div>
                <span className="text-2xl font-bold text-slate-900">
                  {totalActivities && totalActivities > 0 
                    ? Math.round((totalRegistrations || 0) / totalActivities) 
                    : 0}
                </span>
                <p className="text-xs text-slate-500">deltagare</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

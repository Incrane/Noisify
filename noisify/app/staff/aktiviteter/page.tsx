import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Calendar, Plus, Users, MapPin } from "lucide-react";
import { getSelectedOrganization } from "../actions";
import { cn } from "@/lib/utils";

export const revalidate = 0;

export default async function StaffActivitiesPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const status = searchParams.status || "active";
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get Profile & Org IDs
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return null;

  const { data: myOrgs } = await supabase.from("org_user").select("org_id").eq("profile_id", profile.id).gte("role_id", 1);
  const orgIds = myOrgs?.map((o) => o.org_id) || [];

  if (orgIds.length === 0) return <div>Inga behörighet.</div>;

  // Get Selected Org
  const selectedOrgId = await getSelectedOrganization();

  // Fetch Activities
  let query = supabase
    .from("activity_dashboard")
    .select("*")
    .order("skapad_datum", { ascending: false });

  if (selectedOrgId) {
    query = query.eq("owner_org_id", selectedOrgId);
  } else {
    query = query.in("owner_org_id", orgIds);
  }

  // Apply Status Filter
  const now = new Date().toISOString();

  if (status === "archived") {
    // Archived activities are either explicitly ARCHIVED or have passed their start date
    query = query.or(`activity_status.eq.ARCHIVED,start_datum_tid.lt.${now}`);
  } else {
    // Active activities are NOT ARCHIVED and have NOT passed their start date
    query = query.neq("activity_status", "ARCHIVED").gte("start_datum_tid", now);
  }

  const { data: activities } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Hantera Aktiviteter</h1>
        <Link
          href="/staff/aktiviteter/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ny aktivitet
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href="/staff/aktiviteter"
            className={cn(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              status === "active"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            Aktiva aktiviteter
          </Link>
          <Link
            href="/staff/aktiviteter?status=archived"
            className={cn(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              status === "archived"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            Arkiverade aktiviteter
          </Link>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table */}
        <table className="w-full text-left text-sm hidden md:table">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium text-slate-500">Aktivitet</th>
              <th className="px-6 py-4 font-medium text-slate-500">Status</th>
              <th className="px-6 py-4 font-medium text-slate-500">Datum</th>
              <th className="px-6 py-4 font-medium text-slate-500">Platser</th>
              <th className="px-6 py-4 font-medium text-slate-500 text-right">Åtgärd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities?.map((activity) => (
              <tr key={activity.activity_id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{activity.aktivitet}</div>
                  {activity.plats && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3 h-3" /> {activity.plats}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                    ${activity.activity_status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-100' :
                      activity.activity_status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-red-50 text-red-700 border-red-100'}`}>
                    {activity.activity_status === 'PUBLISHED' ? 'Publicerad' :
                      activity.activity_status === 'DRAFT' ? 'Utkast' : 'Arkiverad'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(activity.start_datum_tid).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 pl-6">
                    {activity.start_tid} - {activity.slut_tid}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{activity.antal_godkanda} / {activity.total_kapacitet || '∞'}</span>
                  </div>
                  {activity.antal_vantande > 0 && (
                    <div className="text-xs text-orange-600 font-medium mt-1 pl-6">
                      {activity.antal_vantande} väntar
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/staff/aktiviteter/${activity.activity_id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                  >
                    Hantera
                  </Link>
                </td>
              </tr>
            ))}
            {activities?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Inga aktiviteter hittades.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {activities?.map((activity) => (
            <div key={activity.activity_id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-900">{activity.aktivitet}</div>
                  {activity.plats && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3 h-3" /> {activity.plats}
                    </div>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border
                            ${activity.activity_status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-100' :
                    activity.activity_status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                      'bg-red-50 text-red-700 border-red-100'}`}>
                  {activity.activity_status === 'PUBLISHED' ? 'Publicerad' :
                    activity.activity_status === 'DRAFT' ? 'Utkast' : 'Arkiverad'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {new Date(activity.start_datum_tid).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-slate-400 pl-6">
                    {activity.start_tid} - {activity.slut_tid}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{activity.antal_godkanda} / {activity.total_kapacitet || '∞'}</span>
                  </div>
                  {activity.antal_vantande > 0 && (
                    <div className="text-xs text-orange-600 font-medium pl-6">
                      {activity.antal_vantande} väntar
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Link
                  href={`/staff/aktiviteter/${activity.activity_id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm px-4 py-2 bg-indigo-50 rounded-lg w-full text-center"
                >
                  Hantera
                </Link>
              </div>
            </div>
          ))}
          {activities?.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Inga aktiviteter hittades.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

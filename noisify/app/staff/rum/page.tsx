import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Plus, Users, Calendar, Clock } from "lucide-react";

export const revalidate = 0;

export default async function StaffRoomsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get Profile & Org IDs
  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  if (!profile) return null;

  const { data: myOrgs } = await supabase.from("org_user").select("org_id").eq("profile_id", profile.id).gte("role_id", 1);
  const orgIds = myOrgs?.map((o) => o.org_id) || [];

  if (orgIds.length === 0) return <div>Inga behörighet.</div>;

  // Fetch Rooms
  const { data: rooms } = await supabase
    .from("room_booking_dashboard")
    .select("*")
    .in("org_id", orgIds)
    .order("rum_namn", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Hantera Rum & Lokaler</h1>
        <Link 
          href="/staff/rum/new" 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nytt rum
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms?.map((room) => (
          <Link 
            key={room.room_id}
            href={`/staff/rum/${room.room_id}`}
            className="block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="h-48 bg-slate-100 relative">
               {room.image_url ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={room.image_url} alt={room.rum_namn} className="w-full h-full object-cover" />
               ) : (
                   <div className="flex items-center justify-center h-full text-slate-300 font-bold text-4xl">
                       {room.rum_namn.charAt(0)}
                   </div>
               )}
               <div className="absolute top-4 right-4">
                   <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm uppercase tracking-wide
                       ${room.rumstatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                       {room.rumstatus === 'active' ? 'Aktiv' : 'Inaktiv'}
                   </span>
               </div>
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{room.rum_namn}</h3>
                    <p className="text-sm text-slate-500">{room.organisation}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        {room.kapacitet} pers
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {room.bokningar_idag} idag
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {room.status_nu === 'Ledig' ? (
                            <span className="text-green-600 font-medium">Just nu: Ledig</span>
                        ) : (
                             <span className="text-red-600 font-medium">Just nu: Upptagen</span>
                        )}
                    </div>
                </div>
                
                {room.vantande_godkannande > 0 && (
                    <div className="bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-lg font-medium text-center">
                        {room.vantande_godkannande} bokningar väntar godkännande
                    </div>
                )}
            </div>
          </Link>
        ))}
        
        {rooms?.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
                Inga rum hittades.
            </div>
        )}
      </div>
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { registerForActivity, unregisterFromActivity } from "../actions";

export default async function ActivityDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get Activity
  const { data: activity } = await supabase
    .from("activity_dashboard")
    .select("*")
    .eq("activity_id", id)
    .single();

  if (!activity) {
    return <div>Aktiviteten hittades inte.</div>;
  }

  // 2. Get Profile & Registration Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let registrationStatus = null;
  if (profile) {
    const { data: reg } = await supabase
      .from("registration")
      .select("status")
      .eq("activity_id", id)
      .eq("profile_id", profile.id)
      .single();
    registrationStatus = reg?.status;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/app/aktiviteter"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till aktiviteter
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="relative h-64 md:h-80 bg-slate-100">
          {activity.image_url ? (
            <Image
              src={activity.image_url}
              alt={activity.aktivitet}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-300">
              <Calendar className="w-16 h-16" />
            </div>
          )}
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-indigo-600 shadow-sm uppercase tracking-wider">
              {activity.aktivitetstyp === 'RANDOM' ? 'Lottning' : 'Normal anmälan'}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{activity.aktivitet}</h1>
            <p className="text-lg text-slate-600">{activity.agande_organisation}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Calendar className="w-4 h-4" /> Datum
                </div>
                <p className="font-medium text-slate-900">
                    {new Date(activity.start_datum_tid).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" /> Tid
                </div>
                <p className="font-medium text-slate-900">
                    {activity.start_tid} - {activity.slut_tid}
                </p>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin className="w-4 h-4" /> Plats
                </div>
                <p className="font-medium text-slate-900">
                    {activity.plats || 'Ingen plats angiven'}
                </p>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Users className="w-4 h-4" /> Platser
                </div>
                <p className="font-medium text-slate-900">
                    {activity.kapacitetsstatus}
                </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Om aktiviteten</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {activity.beskrivning || "Ingen beskrivning."}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-8">
            {searchParams.error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                {decodeURIComponent(searchParams.error)}
              </div>
            )}
            {registrationStatus ? (
               <div className="space-y-4">
                   <div className={`p-4 rounded-lg flex items-center justify-between
                       ${registrationStatus === 'ACCEPTED' ? 'bg-green-50 text-green-700' : 
                         registrationStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 
                         registrationStatus === 'WAITLISTED' ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-700'}`}>
                       <div>
                           <p className="font-bold">
                               {registrationStatus === 'ACCEPTED' ? 'Du har en plats!' : 
                                registrationStatus === 'PENDING' ? 'Din anmälan behandlas' : 
                                registrationStatus === 'WAITLISTED' ? 'Du står på reservlistan' : registrationStatus}
                           </p>
                           {registrationStatus === 'ACCEPTED' && <p className="text-sm mt-1">Vi ses där!</p>}
                       </div>
                   </div>
                   
                   <form action={unregisterFromActivity.bind(null, id)}>
                       <button className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors">
                           Avanmäl mig
                       </button>
                   </form>
               </div>
            ) : (
               <form action={registerForActivity.bind(null, id)}>
                   <button className="w-full py-4 px-6 rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all transform active:scale-[0.98]">
                       Anmäl dig nu
                   </button>
                   <p className="text-center text-sm text-slate-500 mt-3">
                       Sista anmälningsdag: {activity.anmalningsfrist ? new Date(activity.anmalningsfrist).toLocaleDateString('sv-SE') : 'Ingen deadline'}
                   </p>
               </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { Calendar, Clock, MapPin, Users, ArrowLeft, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { registerForActivity, unregisterFromActivity } from "../actions";
import { formatInTimeZone } from 'date-fns-tz';
import { sv } from 'date-fns/locale';

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

  // Fetch extra details from activity table
  const { data: activityDetails } = await supabase
    .from("activity")
    .select("lottery_date, confirmation_deadline")
    .eq("id", id)
    .single();

  // 2. Get Profile & Registration Status
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  let registrationStatus = null;
  let registrationNotes = null;
  if (profile) {
    const { data: reg } = await supabase
      .from("registration")
      .select("status, notes")
      .eq("activity_id", id)
      .eq("profile_id", profile.id)
      .single();
    registrationStatus = reg?.status;
    registrationNotes = reg?.notes;
  }

  const timeZone = 'Europe/Stockholm';
  const startDate = new Date(activity.start_datum_tid);
  const endDate = new Date(activity.slut_datum_tid);

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
            <span className={`px-3 py-1 backdrop-blur-md rounded-full text-xs font-bold shadow-sm uppercase tracking-wider ${activity.activity_type === 'RANDOM'
              ? 'bg-purple-100/90 text-purple-700'
              : 'bg-white/90 text-indigo-600'
              }`}>
              {activity.activity_type === 'RANDOM' ? 'Lottning' : 'Normal anmälan'}
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
              <p className="font-medium text-slate-900 capitalize">
                {formatInTimeZone(startDate, timeZone, 'EEEE d MMMM', { locale: sv })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Clock className="w-4 h-4" /> Tid
              </div>
              <p className="font-medium text-slate-900">
                {formatInTimeZone(startDate, timeZone, 'HH:mm', { locale: sv })} - {formatInTimeZone(endDate, timeZone, 'HH:mm', { locale: sv })}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <MapPin className="w-4 h-4" /> Plats
              </div>
              <p className="font-medium text-slate-900">
                {(!activity.hide_address || registrationStatus === 'ACCEPTED')
                  ? (activity.plats || 'Ingen plats angiven')
                  : 'Platsinformation tillgänglig vid bekräftad plats'}
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
            {activity.activity_type === 'RANDOM' && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-purple-600 text-sm font-medium">
                    <Calendar className="w-4 h-4" /> Lottning sker
                  </div>
                  <p className="font-medium text-slate-900">
                    {activityDetails?.lottery_date
                      ? formatInTimeZone(new Date(activityDetails.lottery_date), timeZone, 'd MMMM HH:mm', { locale: sv })
                      : 'Datum ej satt'}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-purple-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Besked senast
                  </div>
                  <p className="font-medium text-slate-900">
                    {activityDetails?.confirmation_deadline
                      ? formatInTimeZone(new Date(activityDetails.confirmation_deadline), timeZone, 'd MMMM HH:mm', { locale: sv })
                      : 'Datum ej satt'}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="prose prose-slate max-w-none">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Om aktiviteten</h3>
            <div
              className="text-slate-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: activity.beskrivning || "Ingen beskrivning." }}
            />
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
                      registrationStatus === 'WAITLISTED' ? 'bg-orange-50 text-orange-700' :
                        registrationStatus === 'REJECTED' ? 'bg-red-50 text-red-700' :
                          'bg-slate-50 text-slate-700'}`}>
                  <div>
                    <p className="font-bold">
                      {registrationStatus === 'ACCEPTED' ? 'Du har en plats!' :
                        registrationStatus === 'PENDING' ? (activity.activity_type === 'RANDOM' ? 'Du deltar i lottningen' : 'Din anmälan behandlas') :
                          registrationStatus === 'WAITLISTED' ? 'Du står på reservlistan' :
                            registrationStatus === 'REJECTED' ? 'Din anmälan har nekats' :
                              registrationStatus}
                    </p>
                    {registrationStatus === 'ACCEPTED' && <p className="text-sm mt-1">Vi ses där!</p>}
                    {registrationStatus === 'PENDING' && activity.activity_type === 'RANDOM' && <p className="text-sm mt-1">Besked kommer efter sista anmälningsdag.</p>}
                    {registrationStatus === 'REJECTED' && registrationNotes && <p className="text-sm mt-1">Meddelande: {registrationNotes}</p>}
                  </div>
                </div>

                {registrationStatus !== 'REJECTED' && (
                  <form action={unregisterFromActivity.bind(null, id)}>
                    <button className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors">
                      {activity.activity_type === 'RANDOM' ? 'Lämna lottningen' : 'Avanmäl mig'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form action={registerForActivity.bind(null, id)}>
                <button className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] ${activity.activity_type === 'RANDOM'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}>
                  {activity.activity_type === 'RANDOM' ? 'Delta i lottning' : 'Anmäl dig nu'}
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

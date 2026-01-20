import { createClient } from "@/utils/supabase/server";
import { Calendar, Clock, MapPin, Mail } from "lucide-react";
import Link from "next/link";
import InvitationActions from "@/components/app/invitation-actions";

export const revalidate = 60; // Cache for 60 seconds

interface Registration {
  id: string; // Added ID
  status: string;
  created_at: string;
  activity: {
    id: string;
    name: string;
    starts_at: string;
    ends_at: string;
    address: string | null;
    image_url: string | null;
  };
}

export default async function MyRegistrationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return <div>Profil saknas.</div>;

  // Fetch registrations with activity details
  const { data: registrations, error } = await supabase
    .from("registration")
    .select(`
      id,
      status,
      created_at,
      activity:activity_id (
        id,
        name,
        starts_at,
        ends_at,
        address,
        image_url
      )
    `)
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching registrations:", error);
    return <div>Kunde inte ladda anmälningar.</div>;
  }

  const now = new Date();
  // Use proper type casting
  const regList = (registrations as unknown as Registration[]) || [];

  const invited = regList.filter((r) => r.status === 'INVITED');
  const upcoming = regList.filter((r) => r.status !== 'INVITED' && new Date(r.activity.starts_at) >= now);
  const past = regList.filter((r) => r.status !== 'INVITED' && new Date(r.activity.starts_at) < now);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Mina Anmälningar</h1>

      {/* Invitations */}
      {invited.length > 0 && (
        <section className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" /> Inbjudningar ({invited.length})
          </h2>
          <div className="space-y-4">
            {invited.map((reg) => (
              <div key={reg.activity.id} className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{reg.activity.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(reg.activity.starts_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(reg.activity.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  <InvitationActions registrationId={reg.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Kommande aktiviteter
        </h2>

        <div className="space-y-4">
          {upcoming.length > 0 ? (
            upcoming.map((reg) => (
              <Link
                key={reg.activity.id}
                href={`/app/aktiviteter/${reg.activity.id}`}
                className="block bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-200 transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">{reg.activity.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(reg.activity.starts_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(reg.activity.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {reg.activity.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {reg.activity.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide
                                ${reg.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                      reg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        reg.status === 'WAITLISTED' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'}`}>
                    {reg.status === 'ACCEPTED' ? 'Klar' :
                      reg.status === 'PENDING' ? 'Väntar' :
                        reg.status === 'WAITLISTED' ? 'Reserv' : reg.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-slate-500 italic">Inga kommande anmälningar.</p>
          )}
        </div>
      </section>

      {/* Past */}
      <section className="pt-8 border-t border-slate-100">
        <h2 className="text-lg font-semibold text-slate-400 mb-4">Tidigare aktiviteter</h2>
        <div className="space-y-4 opacity-75">
          {past.length > 0 ? (
            past.map((reg) => (
              <div key={reg.activity.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-slate-700">{reg.activity.name}</h3>
                  <p className="text-xs text-slate-500">{new Date(reg.activity.starts_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs text-slate-400 font-medium uppercase">Avslutad</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 italic text-sm">Ingen historik.</p>
          )}
        </div>
      </section>
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import { Calendar, Clock, MapPin, Users, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import { getLayoutData } from "@/lib/get-layout-data";
import { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params
  const slug = id
  const supabase = await createClient()

  const { data: activity } = await supabase
    .from("activity_dashboard")
    .select("aktivitet, beskrivning, image_url, agande_organisation, start_datum_tid")
    .eq("slug", slug)
    .maybeSingle()

  if (!activity) {
    return {
      title: "Aktivitet ej funnen - Noisify",
      description: "Kunde inte hitta aktiviteten."
    }
  }

  const dateStr = new Date(activity.start_datum_tid).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });

  return {
    title: `${activity.aktivitet} - ${activity.agande_organisation} | Noisify`,
    description: activity.beskrivning
      ? activity.beskrivning.substring(0, 160)
      : `Kom och delta i ${activity.aktivitet} den ${dateStr} hos ${activity.agande_organisation}.`,
    openGraph: {
      title: `${activity.aktivitet} - ${activity.agande_organisation}`,
      description: activity.beskrivning ? activity.beskrivning.substring(0, 200) : `Kom och delta i ${activity.aktivitet}.`,
      images: activity.image_url ? [activity.image_url] : [],
      siteName: 'Noisify',
      locale: 'sv_SE',
      type: 'website',
    }
  }
}

export default async function PublicActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const slug = id;

  const { cities, cityName, savedCities } = await getLayoutData().catch(err => {
    console.error("Error fetching layout data:", err);
    return {
      cities: [],
      cityName: undefined,
      savedCities: [],
      cityId: undefined
    };
  });

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  console.log(`Fetching activity with slug: ${slug}`);

  // 1. Get Activity
  const { data: activity, error } = await supabase
    .from("activity_dashboard")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching activity:", error);
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} user={user} />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Aktiviteten hittades inte</h1>
          <p className="text-slate-500 mt-2">Slug: {slug}</p>
          <Link href="/aktiviteter" className="text-indigo-600 hover:underline mt-4 inline-block">Tillbaka till aktiviteter</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} user={user} />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Link
            href="/aktiviteter"
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
                <div className="bg-indigo-50 rounded-xl p-6 text-center space-y-4">
                  <h3 className="text-lg font-bold text-indigo-900">Vill du vara med?</h3>
                  <p className="text-indigo-700">Du måste ha ett konto för att anmäla dig till aktiviteter.</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm">
                      Logga in
                    </Link>
                    <Link href="/register" className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-full hover:bg-indigo-50 transition-colors shadow-sm border border-indigo-200">
                      Skapa konto
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

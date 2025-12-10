import { createClient } from "@/utils/supabase/server";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail, ArrowLeft, BookOpen, Clock, Users } from "lucide-react";
import ActivityCard from "@/components/activity-card";
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

  const { data: org } = await supabase
    .from("organizations")
    .select("name:org_namn, description:org_description, logo_url")
    .eq("slug", slug)
    .maybeSingle()

  if (!org) {
    return {
      title: "Organisation ej funnen - Noisify",
      description: "Kunde inte hitta organisationen."
    }
  }

  return {
    title: `${org.name} - Fritidsgård i Göteborg | Noisify`,
    description: org.description || `Se aktiviteter och information om ${org.name} på Noisify.`,
    openGraph: {
      title: `${org.name} - Fritidsgård i Göteborg`,
      description: org.description || `Se aktiviteter och information om ${org.name} på Noisify.`,
      images: org.logo_url ? [org.logo_url] : [],
      siteName: 'Noisify',
      locale: 'sv_SE',
      type: 'website',
    }
  }
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const slug = id;
  const { cities, cityName, savedCities } = await getLayoutData();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  console.log(`Fetching organization with slug: ${slug}`);

  // 1. Get Organization
  // Note: 'kontakt' is JSONB, so we extract 'epost' directly.
  const { data: org, error } = await supabase
    .from("organizations")
    .select("org_id:id, name:org_namn, description:org_description, logo_url, address:adress, contact_email:kontakt->>epost")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching organization:", error);
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} user={user} />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Organisationen hittades inte</h1>
          <Link href="/organisationer" className="text-indigo-600 hover:underline mt-4 inline-block">Tillbaka till organisationer</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // 2. Get Organization's Activities
  const { data: activities } = await supabase
    .from("v_explore_activities")
    .select("activity_id, slug, aktivitet:activity_name, agande_organisation:organization_name, image_url, start_datum_tid:starts_at, start_tid:start_time, slut_tid:end_time, plats:address, kapacitetsstatus:capacity_status, lediga_platser:available_spots, hide_address")
    .eq("activity_status", "PUBLISHED")
    .eq("organization_id", org.org_id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  // 3. Get Organization's Courses
  const { data: courses } = await supabase
    .from("course_dashboard")
    .select("*")
    .eq("status", "PUBLISHED")
    .eq("agande_org_id", org.org_id)
    .order("skapad_datum", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} user={user} />

      <main className="container mx-auto px-4 py-12">
        <Link
          href="/organisationer"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Tillbaka till organisationer
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-12">
          <div className="bg-indigo-600 h-32 md:h-48 relative"></div>
          <div className="px-8 pb-8">
            <div className="relative -top-12 md:-top-16 -mb-12 md:-mb-16">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1 shadow-md inline-block">
                <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-100">
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt={org.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold text-3xl">
                      {org.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-16 md:mt-20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{org.name}</h1>
                {user && (
                  <Link
                    href={`/app/chatt?orgId=${org.org_id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Ställ fråga
                  </Link>
                )}
              </div>
              {org.address && (
                <div className="flex items-center gap-1 text-slate-500 mb-6">
                  <MapPin className="w-4 h-4" /> {org.address}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Om oss</h2>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {org.description || "Ingen beskrivning."}
                  </p>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Kontakt</h2>
                  <div className="space-y-3">
                    {org.contact_email && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${org.contact_email}`} className="hover:text-indigo-600">{org.contact_email}</a>
                      </div>
                    )}

                    {!org.contact_email && (
                      <p className="text-slate-500 italic text-sm">Inga kontaktuppgifter.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-6">Våra aktiviteter</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities?.map((activity) => (
            <ActivityCard
              key={activity.activity_id}
              activity={activity}
              hideFavorite={!user}
            />
          ))}
          {activities?.length === 0 && (
            <p className="text-slate-500 italic col-span-full">Inga publicerade aktiviteter just nu.</p>
          )}
        </div>

        {/* Courses Section */}
        {courses && courses.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Våra kurser</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.course_id}
                  href={`/kurser/${course.course_id}`}
                  className="group block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all hover:border-indigo-200"
                >
                  <div className="relative h-48 bg-slate-100">
                    {course.image_url ? (
                      <Image
                        src={course.image_url}
                        alt={course.kursnamn}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-300">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 line-clamp-1">
                        {course.kursnamn}
                      </h3>
                      <p className="text-sm text-slate-500">{course.agande_organisation}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{course.langd_timmar ? `${course.langd_timmar}h` : '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{course.antal_inskrivna || 0} deltagare</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

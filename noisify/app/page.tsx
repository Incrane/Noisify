import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Smartphone, Users, CheckCircle, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import ActivityCard from "@/components/activity-card";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import CityModal from "@/components/landing/city-modal";
import { cookies } from "next/headers";
import { getSavedCities, setCityCookie, saveCity, removeCity } from "@/app/actions/city";

// Server Actions Wrappers to ensure correct binding
async function saveCityAction(cityId: string, cityName: string) {
  'use server'
  return await saveCity(cityId, cityName)
}

async function removeCityAction(cityId: string) {
  'use server'
  await removeCity(cityId)
}

async function selectCityAction(cityId: string, cityName: string) {
  'use server'
  await setCityCookie(cityId, cityName)
}


// Define interfaces locally to avoid circular deps or file touches, matching ActivityCard props
interface Activity {
  activity_id: string;
  slug?: string;
  aktivitet: string;
  agande_organisation: string;
  image_url: string | null;
  start_datum_tid: string;
  start_tid: string;
  slut_tid: string;
  plats: string | null;
  kapacitetsstatus: string;
  lediga_platser: number | null;
}

interface Organisation {
  org_id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  slug?: string;
}

interface Category {
  id: string;
  category_name: string;
}

export default async function Home() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const cityId = cookieStore.get("noisify_city_id")?.value;
  const cityName = cookieStore.get("noisify_city_name")?.value;
  const savedCities = await getSavedCities();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch available cities from database
  const { data: citiesData, error: cityError } = await supabase
    .from("cities")
    .select("id, name:city")
    .eq("available", true);

  if (cityError) console.error("Error fetching cities:", cityError);

  const cities = (citiesData as unknown as { id: string; name: string }[]) || [];

  // Fetch categories
  const { data: categoriesData, error: catError } = await supabase.from("categories").select("id, category_name:cat_name");
  if (catError) console.error("Error fetching categories:", catError);
  const categories = (categoriesData as unknown as Category[]) || [];

  // Fetch active organizations
  let orgQuery = supabase
    .from("organizations")
    .select("org_id:id, name:org_namn, logo_url, description:org_description, slug");

  if (cityId) {
    orgQuery = orgQuery.eq("city_id", cityId);
  }

  const { data: organizationsData, error: orgError } = await orgQuery;
  if (orgError) console.error("Error fetching organizations:", JSON.stringify(orgError, null, 2));
  const organizations = organizationsData as unknown as Organisation[] | null;

  // Collect org IDs for activity filtering
  const orgIds = organizations?.map(o => o.org_id) || [];

  // Fetch upcoming public activities (limit 9)
  let activityQuery = supabase
    .from("activity_dashboard")
    .select("*")
    .eq("visibility", "PUBLIC")
    .eq("activity_status", "PUBLISHED")
    .gte("start_datum_tid", new Date().toISOString())
    .order("start_datum_tid", { ascending: true })
    .limit(9);

  if (cityId) {
    if (orgIds.length > 0) {
      activityQuery = activityQuery.in("agande_org_id", orgIds);
    } else {
      // If city is selected but no organizations found, we shouldn't fetch any activities
      // We can simulate an empty result by filtering on a non-existent ID or just not running the query
      // Simplest is to filter by impossible ID
      activityQuery = activityQuery.eq("agande_org_id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data: activitiesData, error: actError } = await activityQuery;
  if (actError) console.error("Error fetching activities:", actError);
  const activities = activitiesData as unknown as Activity[] | null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <SiteHeader
        cities={cities}
        selectedCityId={cityId}
        selectedCityName={cityName}
        savedCities={savedCities}
        user={user}
        onSelectCity={selectCityAction}
        onSaveCity={saveCityAction}
        onRemoveCity={removeCityAction}
      />

      {!cityId && <CityModal cities={cities} defaultOpen={true} />}

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <Link href="/for-organisationer" className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8 hover:bg-indigo-100 transition-colors border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Nyhet: Checka in via dashboard
              <ArrowRight className="w-3 h-3" />
            </Link>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Fritidsaktiviteter i <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">
                {cityName || "Göteborg"}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Hitta roliga och gratis aktiviteter för barn och unga – från sport och dans till musik, teater och mycket mer.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-semibold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                <span className="rotate-90 transform inline-block">➔</span> Logga in
              </Link>
              <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-full font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 flex items-center justify-center">
                Skapa Gratis Konto
              </Link>
            </div>
          </div>
        </section>

        {/* Upcoming Activities Section */}
        <section className="py-20 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Kommande aktiviteter</h2>

                {/* Search Bar Mockup */}
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Sök aktivitet..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
                    readOnly // Read only for landing page demo
                  />
                </div>
              </div>

              <Link href="/aktiviteter" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
                Alla aktiviteter
              </Link>
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap gap-2 mb-12 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:overflow-visible no-scrollbar">
              <Link
                href="/aktiviteter"
                className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium flex items-center gap-1 whitespace-nowrap hover:bg-indigo-200 transition-colors"
              >
                <Users className="w-3 h-3" /> Alla aktiviteter
              </Link>
              {categories && categories.length > 0 ? (
                categories.slice(0, 10).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/aktiviteter?category=${encodeURIComponent(cat.category_name)}`}
                    className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors whitespace-nowrap"
                  >
                    {cat.category_name}
                  </Link>
                ))
              ) : (
                <span className="text-sm text-slate-400">Laddar kategorier...</span>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {activities && activities.length > 0 ? (
                activities.map((activity) => (
                  <ActivityCard
                    key={activity.activity_id}
                    activity={activity}
                    hideFavorite={!user}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-500">Inga kommande aktiviteter just nu{cityName ? ` i ${cityName}` : ''}.</p>
                </div>
              )}
            </div>

            {/* Pagination Mockup */}
            <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-medium cursor-not-allowed">
                ← Previous
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium">1</span>
                <span className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer">2</span>
                <span className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer">3</span>
                <span className="text-slate-400">...</span>
                <span className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer">8</span>
                <span className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer">9</span>
                <span className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium cursor-pointer">10</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 text-sm font-medium cursor-pointer transition-colors">
                Next →
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition / Info Section */}
        <section className="py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  För unga: alltid gratis.<br />
                  För fritidsgårdar: alltid enkelt.
                </h2>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Skapa ett gratis konto för er organisation.
                </p>
                <p className="text-slate-600 mb-10 leading-relaxed">
                  Nå ut till barn och unga i {cityName || "Göteborg"} genom att lägga upp era aktiviteter helt kostnadsfritt. Det är enkelt, snabbt och hjälper fler att hitta till er verksamhet.
                </p>
                <div className="flex gap-4">
                  <Link href="/how-it-works" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                    Så funkar det
                  </Link>
                  <Link href="/register" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Kom igång
                  </Link>
                </div>
              </div>

              {/* Image Grid / Collage */}
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 mt-8">
                    <div className="h-48 bg-slate-100 rounded-2xl overflow-hidden relative">
                      {/* Placeholder for image */}
                      <div className="absolute inset-0 bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                        <Users className="w-10 h-10 text-indigo-200" />
                      </div>
                    </div>
                    <div className="h-64 bg-slate-100 rounded-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
                        <Smartphone className="w-10 h-10 text-blue-200" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-64 bg-slate-100 rounded-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-linear-to-br from-pink-50 to-rose-50 flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-pink-200" />
                      </div>
                    </div>
                    <div className="h-48 bg-slate-100 rounded-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-linear-to-br from-amber-50 to-orange-50 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-amber-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Organizations Showcase */}
        <section className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Anslutna Fritidsgårdar</h2>
              <p className="text-slate-600">Vi samarbetar med fritidsgårdar över hela {cityName || "Göteborg"}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {organizations && organizations.length > 0 ? (
                organizations.map((org) => (
                  <Link
                    key={org.org_id}
                    href={`/organisationer/${org.slug || org.org_id}`}
                    className="group bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3"
                  >
                    {org.logo_url ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-50">
                        <Image src={org.logo_url} alt={org.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <span className="font-bold text-xl">{org.name.substring(0, 1)}</span>
                      </div>
                    )}
                    <span className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{org.name}</span>
                  </Link>
                ))
              ) : (
                <p className="col-span-full text-center text-slate-500">Inga organisationer anslutna än.</p>
              )}
            </div>

            <div className="text-center mt-12">
              <Link href="/organisationer" className="text-indigo-600 font-medium hover:text-indigo-700 inline-flex items-center gap-1">
                Se alla fritidsgårdar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

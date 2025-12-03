import { createClient } from "@/utils/supabase/server";
import ActivityCard from "@/components/activity-card";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import SearchFilters from "@/components/search-filters";
import { getLayoutData } from "@/lib/get-layout-data";
import { Metadata } from "next";
import { setCityCookie, saveCity, removeCity } from "@/app/actions/city";

// Server Actions Wrappers
async function selectCityAction(cityId: string, cityName: string) {
  'use server'
  await setCityCookie(cityId, cityName)
}

async function saveCityAction(cityId: string, cityName: string) {
  'use server'
  return await saveCity(cityId, cityName)
}

async function removeCityAction(cityId: string) {
  'use server'
  await removeCity(cityId)
}

export const metadata: Metadata = {
  title: "Aktiviteter för unga i Göteborg - Gratis events | Noisify",
  description: "Hitta gratis aktiviteter, workshops och events för unga (10-20 år) i Göteborg. Sport, musik, kultur och skapande på fritidsgårdar.",
};

export const revalidate = 0; // Dynamic for search

export default async function PublicActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string; category?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const query = params.q;
  const date = params.date;
  const category = params.category;
  const { cities, cityName, savedCities, cityId } = await getLayoutData();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Start building query
  let dbQuery = supabase
    .from("v_explore_activities")
    .select("*")
    .eq("activity_status", "PUBLISHED")
    .gte("start_datum_tid", new Date().toISOString()) // Only upcoming activities
    .order("start_datum_tid", { ascending: true });

  if (cityId) {
    const { data: orgs } = await supabase.from("organizations").select("id").eq("city_id", cityId);
    const orgIds = orgs?.map(o => o.id) || [];

    if (orgIds.length > 0) {
      dbQuery = dbQuery.in("agande_org_id", orgIds);
    } else {
      dbQuery = dbQuery.eq("agande_org_id", "00000000-0000-0000-0000-000000000000");
    }
  }

  if (query) {
    dbQuery = dbQuery.ilike("aktivitet", `%${query}%`);
  }

  if (date) {
    // Filter by start date matching the selected date (ignoring time)
    // Assuming start_datum_tid is timestamp
    dbQuery = dbQuery
      .gte("start_datum_tid", `${date}T00:00:00`)
      .lte("start_datum_tid", `${date}T23:59:59`);
  }

  if (category) {
    dbQuery = dbQuery.contains('categories_json', JSON.stringify([{ cat_name: category }]));
  }

  const { data: activities, error } = await dbQuery;

  if (error) {
    console.error("Error fetching activities:", error);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader
        cities={cities}
        selectedCityName={cityName}
        savedCities={savedCities}
        user={user}
        onSelectCity={selectCityAction}
        onSaveCity={saveCityAction}
        onRemoveCity={removeCityAction}
      />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Hitta aktiviteter nära dig
          </h1>
          <p className="text-lg text-slate-600">
            Utforska spännande events, kurser och mötesplatser på fritidsgårdar i Göteborg.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <SearchFilters />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities?.map((activity) => (
            <ActivityCard
              key={activity.activity_id}
              activity={activity}
              hideFavorite={!user}
            />
          ))}

          {activities?.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              Just nu finns inga publicerade aktiviteter.
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

import { createClient } from "@/utils/supabase/server";
import SiteHeader from "@/components/landing/site-header";
import SiteFooter from "@/components/site-footer";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import SearchInput from "@/components/search-input";
import { getLayoutData } from "@/lib/get-layout-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fritidsgårdar i Göteborg - Hitta din mötesplats | Noisify",
  description: "Utforska alla fritidsgårdar och mötesplatser för unga i Göteborg. Hitta öppettider, kontaktuppgifter och aktiviteter.",
};

export const revalidate = 0; // Dynamic for search

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const query = params.q;
  const { cities, cityName, savedCities, cityId } = await getLayoutData();
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // Start building query
  let dbQuery = supabase
    .from("organizations")
    .select("org_id:id, name:org_namn, description:org_description, logo_url, address:adress, slug")
    .order("org_namn");

  if (cityId) {
    dbQuery = dbQuery.eq("city_id", cityId);
  }

  if (query) {
    dbQuery = dbQuery.ilike("org_namn", `%${query}%`);
  }

  const { data: organizations } = await dbQuery;

  // Map to previous interface if needed, but better to use DB columns directly
  // Org interface: id -> org_id, org_namn -> name, org_description -> description, adress -> address

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader cities={cities} selectedCityName={cityName} savedCities={savedCities} user={user} />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Möt våra fritidsgårdar
          </h1>
          <p className="text-lg text-slate-600">
            Här hittar du alla organisationer som erbjuder aktiviteter för dig.
          </p>
        </div>

        <SearchInput placeholder="Sök efter fritidsgård..." className="max-w-md mx-auto mb-12" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations?.map((org) => (
            <Link
              key={org.org_id}
              href={`/organisationer/${org.slug || org.org_id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all hover:border-indigo-200 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full mb-4 relative overflow-hidden border border-slate-200">
                {org.logo_url ? (
                  <Image src={org.logo_url} alt={org.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 font-bold text-3xl">
                    {org.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">{org.name}</h3>
              {org.address && (
                <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                  <MapPin className="w-4 h-4" /> {org.address}
                </div>
              )}
              <p className="text-slate-600 text-sm line-clamp-3">
                {org.description || "Ingen beskrivning."}
              </p>
            </Link>
          ))}

          {organizations?.length === 0 && (
            <div className="col-span-full text-center text-slate-500">
              Inga organisationer hittades.
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

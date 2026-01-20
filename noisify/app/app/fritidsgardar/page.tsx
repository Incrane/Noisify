import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import SearchInput from "@/components/search-input";
import { Suspense } from "react";

export const revalidate = 60; // Cache for 60 seconds

export default async function YouthCentersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; show_all?: string }>;
}) {
    const supabase = await createClient();
    const params = await searchParams;
    const query = typeof params.q === 'string' ? params.q.toLowerCase() : '';
    const showAll = params.show_all === 'true';

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Get user's city_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('city_id')
        .eq('user_id', user?.id)
        .single();

    const userCityId = profile?.city_id;

    // Fetch organizations
    let orgsQuery = supabase
        .from('organizations')
        .select(`
            id,
            slug,
            org_namn,
            org_description,
            logo_url,
            adress,
            city_id,
            cities (
                city
            )
        `)
        .eq('org_status', 'active');

    // If user has a city and not searching/showing all, filter by city
    if (userCityId && !query && !showAll) {
        orgsQuery = orgsQuery.eq('city_id', userCityId);
    }

    const { data: organizations } = await orgsQuery;

    // Filter by search query if present
    const filteredOrgs = organizations?.filter(org => {
        if (!query) return true;
        const cityData = org.cities as any;
        const cityName = Array.isArray(cityData) ? cityData[0]?.city : cityData?.city;
        return (
            org.org_namn.toLowerCase().includes(query) ||
            cityName?.toLowerCase().includes(query)
        );
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Fritidsgårdar</h1>
                <p className="text-slate-500">
                    Hitta fritidsgårdar nära dig och se vad som händer.
                </p>
            </div>

            <SearchInput placeholder="Sök efter fritidsgård..." className="max-w-md mx-auto mb-12" />

            {userCityId && !query && (
                <div className="flex items-center justify-between bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-900">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">Visar gårdar i din stad</span>
                    </div>
                    {!showAll && (
                        <Link
                            href="/app/fritidsgardar?show_all=true"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Visa alla städer
                        </Link>
                    )}
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.map((org) => (
                    <Link
                        key={org.id}
                        href={`/app/fritidsgardar/${org.slug || org.id}`}
                        className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all hover:border-indigo-200"
                    >
                        <div className="relative h-48 bg-slate-100">
                            {org.logo_url ? (
                                <Image
                                    src={org.logo_url}
                                    alt={org.org_namn}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                    <span className="text-4xl font-bold opacity-20">
                                        {org.org_namn.charAt(0)}
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-white font-bold text-lg group-hover:text-indigo-200 transition-colors">
                                    {org.org_namn}
                                </h3>
                                <div className="flex items-center gap-1 text-slate-200 text-sm">
                                    <MapPin className="w-3 h-3" />
                                    <span>{Array.isArray(org.cities) ? (org.cities[0] as any)?.city : (org.cities as any)?.city}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-slate-600 text-sm line-clamp-2">
                                {org.org_description || "Ingen beskrivning tillgänglig."}
                            </p>
                        </div>
                    </Link>
                ))}

                {filteredOrgs.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        Inga fritidsgårdar hittades.
                    </div>
                )}
            </div>
        </div>
    );
}

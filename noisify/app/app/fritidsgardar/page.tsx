import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import SearchInput from "@/components/search-input";

export const revalidate = 0; // Dynamic for search

export default async function YouthCentersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; show_all?: string }>;
}) {
    const supabase = await createClient();
    const params = await searchParams;
    const query = params.q;
    const showAll = params.show_all === 'true';

    // Get current user and profile with city
    const { data: { user } } = await supabase.auth.getUser();
    let userCityId: string | null = null;
    let userCityName: string | null = null;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("city_id, cities(city)")
            .eq("user_id", user.id)
            .single();

        if (profile?.city_id) {
            userCityId = profile.city_id;
            // @ts-ignore - Supabase types might not infer the join correctly without generation
            userCityName = profile.cities?.city;
        }
    }

    let dbQuery = supabase
        .from("organizations")
        .select("id, org_namn, org_description, logo_url, city_id, adress")
        .eq("org_status", "active")
        .order("org_namn");

    if (query) {
        dbQuery = dbQuery.ilike("org_namn", `%${query}%`);
    } else if (userCityId && !showAll) {
        // Only filter by city if no search query and not explicitly showing all
        dbQuery = dbQuery.eq("city_id", userCityId);
    }

    const { data: organizations } = await dbQuery;

    return (
        <div className="space-y-6">
            <div className="text-center max-w-3xl mx-auto mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    Fritidsgårdar
                </h1>
                <p className="text-slate-600">
                    Här hittar du alla fritidsgårdar och kan ansöka om medlemskap.
                </p>
            </div>

            <SearchInput placeholder="Sök efter fritidsgård..." className="max-w-md mx-auto mb-12" />

            {userCityId && !query && (
                <div className="flex items-center justify-between bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-900">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">
                            {showAll
                                ? "Visar alla fritidsgårdar"
                                : `Visar fritidsgårdar i ${userCityName || 'din stad'}`
                            }
                        </span>
                    </div>
                    {showAll ? (
                        <Link
                            href="/app/fritidsgardar"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                            Visa bara min stad
                        </Link>
                    ) : (
                        <Link
                            href="/app/fritidsgardar?show_all=true"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                        >
                            Visa alla städer
                        </Link>
                    )}
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations?.map((org) => (
                    <Link
                        key={org.id}
                        href={`/app/fritidsgardar/${org.id}`}
                        className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all hover:border-indigo-200 flex flex-col items-center text-center"
                    >
                        <div className="w-24 h-24 bg-slate-100 rounded-full mb-4 relative overflow-hidden border border-slate-200">
                            {org.logo_url ? (
                                <Image src={org.logo_url} alt={org.org_namn} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 font-bold text-3xl">
                                    {org.org_namn.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 mb-2">{org.org_namn}</h3>
                        {org.adress && (
                            <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                                <MapPin className="w-4 h-4" /> {org.adress}
                            </div>
                        )}
                        <p className="text-slate-600 text-sm line-clamp-3">
                            {org.org_description || "Ingen beskrivning."}
                        </p>
                    </Link>
                ))}

                {organizations?.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-12">
                        Inga fritidsgårdar hittades.
                    </div>
                )}
            </div>
        </div>
    );
}

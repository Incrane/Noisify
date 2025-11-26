import { createClient } from "@/utils/supabase/server";
import { processUpgrade } from "../actions";
import { CheckCircle, XCircle, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import UpgradeActionButtons from "./upgrade-buttons";

export default async function UpgradesPage() {
    const supabase = await createClient();

    // Fetch orgs with pending upgrade requests
    const { data: requests, error } = await supabase
        .from("organizations")
        .select("*, cities(city)")
        .not("upgrade_requested_tier", "is", null)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching upgrades:", error);
        return <div>Error loading upgrades</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Uppgraderingar</h2>
                    <p className="text-slate-500">Hantera förfrågningar om att byta prenumerationsnivå</p>
                </div>
            </div>

            <div className="grid gap-4">
                {requests?.map((org) => (
                    <div
                        key={org.id}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{org.org_namn}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>Nuvarande: <span className="font-medium text-slate-700">{org.tier || "FREE"}</span></span>
                                    <span>→</span>
                                    <span>Önskad: <span className="font-medium text-indigo-600">{org.upgrade_requested_tier}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <UpgradeActionButtons
                                orgId={org.id}
                                requestedTier={org.upgrade_requested_tier}
                            />
                        </div>
                    </div>
                ))}

                {requests?.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Inga förfrågningar</h3>
                        <p className="text-slate-500 text-sm">Det finns inga väntande uppgraderingar just nu</p>
                    </div>
                )}
            </div>
        </div>
    );
}

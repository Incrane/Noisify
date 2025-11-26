import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { approveOrganization, rejectOrganization } from "../actions";
import { CheckCircle, XCircle, Clock, Building2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";

export default async function OrganizationsPage({
    searchParams,
}: {
    searchParams: { filter?: string; q?: string };
}) {
    const supabase = await createClient();
    const filter = searchParams.filter || "all";
    const query = searchParams.q || "";

    let dbQuery = supabase
        .from("organizations")
        .select("*, cities(city)")
        .order("created_at", { ascending: false });

    if (filter === "pending") {
        dbQuery = dbQuery.eq("org_status", "pending");
    } else if (filter === "active") {
        dbQuery = dbQuery.eq("org_status", "active");
    }

    if (query) {
        dbQuery = dbQuery.ilike("org_namn", `%${query}%`);
    }

    const { data: organizations, error } = await dbQuery;

    if (error) {
        console.error("Error fetching organizations:", error);
        return <div>Error loading organizations</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Organisationer</h2>
                    <p className="text-slate-500">Hantera alla anslutna verksamheter</p>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Sök organisation..."
                        className="pl-9 bg-slate-50 border-slate-200"
                        defaultValue={query}
                    />
                </div>
                <div className="flex gap-2">
                    <TabLink active={filter === "all"} href="/super_admin/organizations" label="Alla" />
                    <TabLink active={filter === "pending"} href="/super_admin/organizations?filter=pending" label="Väntande" count={organizations?.filter(o => o.org_status === 'pending').length} />
                    <TabLink active={filter === "active"} href="/super_admin/organizations?filter=active" label="Aktiva" />
                </div>
            </div>

            <div className="grid gap-4">
                {organizations?.map((org) => (
                    <div
                        key={org.id}
                        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                {org.logo_url ? (
                                    <img src={org.logo_url} alt={org.org_namn} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <Building2 className="w-6 h-6" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">{org.org_namn}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>{org.cities?.city || "Ingen stad"}</span>
                                    <span>•</span>
                                    <span>Skapad {new Date(org.created_at).toLocaleDateString("sv-SE")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <StatusBadge status={org.org_status} />

                            <div className="flex items-center gap-2">
                                {org.org_status === "pending" && (
                                    <>
                                        <form action={async () => {
                                            "use server";
                                            await approveOrganization(org.id);
                                        }}>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Godkänn
                                            </Button>
                                        </form>
                                        <form action={async () => {
                                            "use server";
                                            await rejectOrganization(org.id);
                                        }}>
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                                                <XCircle className="w-4 h-4" />
                                                Neka
                                            </Button>
                                        </form>
                                    </>
                                )}
                                <Button variant="ghost" size="sm">Hantera</Button>
                            </div>
                        </div>
                    </div>
                ))}

                {organizations?.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">Inga organisationer hittades</h3>
                        <p className="text-slate-500 text-sm">Prova att ändra filter eller söktermer</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        inactive: "bg-slate-100 text-slate-700 border-slate-200",
        suspended: "bg-red-100 text-red-700 border-red-200",
    };

    const labels = {
        pending: "Väntar godkännande",
        active: "Aktiv",
        inactive: "Inaktiv",
        suspended: "Avstängd",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.inactive}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}

function TabLink({ active, href, label, count }: { active: boolean; href: string; label: string; count?: number }) {
    return (
        <Link
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50"
                }`}
        >
            {label}
            {count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${active ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"
                    }`}>
                    {count}
                </span>
            )}
        </Link>
    )
}

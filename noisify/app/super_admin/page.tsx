import { getAdminStats } from "./actions";
import { Users, Building2, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboard() {
    const stats = await getAdminStats();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-900">Översikt</h2>
                <p className="text-slate-500 mt-1">Välkommen till Super Admin panelen.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Totalt antal organisationer"
                    value={stats.totalOrgs}
                    icon={Building2}
                    color="blue"
                    href="/super_admin/organizations"
                />
                <StatCard
                    title="Väntande godkännanden"
                    value={stats.pendingOrgs}
                    icon={AlertCircle}
                    color="amber"
                    href="/super_admin/organizations?filter=pending"
                    highlight={stats.pendingOrgs > 0}
                />
                <StatCard
                    title="Uppgraderingsförfrågningar"
                    value={stats.upgradeRequests}
                    icon={TrendingUp}
                    color="emerald"
                    href="/super_admin/upgrades"
                    highlight={stats.upgradeRequests > 0}
                />
                <StatCard
                    title="Totalt antal användare"
                    value={stats.totalUsers}
                    icon={Users}
                    color="indigo"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions or Recent Activity could go here */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Genvägar</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/super_admin/organizations"
                            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                        >
                            <span className="block font-medium text-slate-900">Hantera Organisationer</span>
                            <span className="text-sm text-slate-500">Godkänn, neka eller redigera</span>
                        </Link>
                        <Link
                            href="/super_admin/upgrades"
                            className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
                        >
                            <span className="block font-medium text-slate-900">Hantera Uppgraderingar</span>
                            <span className="text-sm text-slate-500">Granska prenumerationsändringar</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    color,
    href,
    highlight = false
}: {
    title: string;
    value: number;
    icon: any;
    color: "blue" | "amber" | "emerald" | "indigo";
    href?: string;
    highlight?: boolean;
}) {
    const colors = {
        blue: "bg-blue-100 text-blue-600",
        amber: "bg-amber-100 text-amber-600",
        emerald: "bg-emerald-100 text-emerald-600",
        indigo: "bg-indigo-100 text-indigo-600",
    };

    const Content = (
        <>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {highlight && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-600">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Kräver åtgärd
                </div>
            )}
        </>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="block bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition-all hover:border-indigo-200 group"
            >
                {Content}
            </Link>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {Content}
        </div>
    );
}

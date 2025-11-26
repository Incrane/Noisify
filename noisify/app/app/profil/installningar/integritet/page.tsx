import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Info } from "lucide-react";

export default async function PrivacySettingsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/app/profil"
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <p className="text-sm text-slate-500">Tillbaka</p>
                    <h1 className="text-2xl font-bold text-slate-900">Integritet</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Din data och integritet är viktig för oss.
                    </p>
                </div>
            </div>

            {/* GDPR Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                        <h3 className="font-semibold text-blue-900">
                            Dina rättigheter enligt GDPR
                        </h3>
                        <p className="text-sm text-blue-800">
                            Du har rätt att få tillgång till, rätta, radera och överföra dina
                            personuppgifter. Kontakta oss om du vill utöva någon av dessa
                            rättigheter.
                        </p>
                    </div>
                </div>
            </div>

            {/* Privacy Settings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4" />
                        Integritetsinställningar
                    </h3>
                    <p className="text-sm text-slate-600">
                        Här kommer du kunna hantera vilka som kan se din profil och dina
                        aktiviteter. Denna funktion är under utveckling.
                    </p>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-medium text-slate-900 mb-3">
                        Begär dina data
                    </h4>
                    <p className="text-sm text-slate-600 mb-4">
                        Du kan begära en kopia av all data vi har om dig. Detta kan ta upp
                        till 30 dagar att behandla.
                    </p>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                        Begär dataexport
                    </button>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-medium text-slate-900 mb-3">
                        Integritetspolicy
                    </h4>
                    <p className="text-sm text-slate-600 mb-4">
                        Läs vår integritetspolicy för att förstå hur vi hanterar dina
                        personuppgifter.
                    </p>
                    <a
                        href="/privacy"
                        target="_blank"
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                        Läs integritetspolicy →
                    </a>
                </div>
            </div>
        </div>
    );
}

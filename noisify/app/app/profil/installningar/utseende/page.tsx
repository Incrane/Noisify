import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import DisplaySettingsClient from "./display-settings-client";

export default function DisplaySettingsPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/app/profil"
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <p className="text-sm text-slate-500">Tillbaka</p>
                    <h1 className="text-2xl font-bold text-slate-900">Utseende</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Anpassa tema och tillgänglighet.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <DisplaySettingsClient />
            </div>
        </div>
    );
}

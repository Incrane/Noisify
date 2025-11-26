"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteAccountPage() {
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleDelete = async () => {
        if (confirmText !== "RADERA") {
            setError("Vänligen skriv 'RADERA' för att bekräfta");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/delete-account", {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Något gick fel");
            }

            router.push("/");
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/app/profil"
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <p className="text-sm text-slate-500">Tillbaka</p>
                    <h1 className="text-2xl font-bold text-red-600">Radera konto</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Detta kan inte ångras
                    </p>
                </div>
            </div>

            {/* Warning Card */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div className="space-y-3">
                        <h3 className="font-semibold text-red-900 text-lg">
                            Varning: Permanent radering
                        </h3>
                        <p className="text-sm text-red-800">
                            När du raderar ditt konto kommer:
                        </p>
                        <ul className="text-sm text-red-800 space-y-2 list-disc list-inside">
                            <li>All din profildata raderas permanent</li>
                            <li>Dina medlemskap avslutas</li>
                            <li>Dina aktivitetsanmälningar tas bort</li>
                            <li>Din chatthistorik raderas</li>
                            <li>Detta kan INTE ångras</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Confirmation Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
                <div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                        Bekräfta radering
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                        För att radera ditt konto, skriv{" "}
                        <span className="font-mono font-bold text-red-600">RADERA</span> i
                        fältet nedan och klicka på knappen.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Skriv RADERA"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                    />

                    <button
                        onClick={handleDelete}
                        disabled={loading || confirmText !== "RADERA"}
                        className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Raderar..." : "Radera mitt konto permanent"}
                    </button>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-medium text-slate-900 mb-2">
                        Alternativ till radering
                    </h4>
                    <p className="text-sm text-slate-600 mb-4">
                        Om du är osäker kan du istället:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                        <li>Pausa dina notifikationer i inställningarna</li>
                        <li>Avsluta dina medlemskap utan att radera kontot</li>
                        <li>Kontakta support för hjälp</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

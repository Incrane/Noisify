import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Åtkomst nekad
                    </h1>

                    <p className="text-slate-600 mb-8">
                        Du har inte behörighet att se denna sida. Denna del av systemet är endast tillgänglig för Super Admins.
                    </p>

                    <div className="space-y-3">
                        <Link
                            href="/staff"
                            className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                        >
                            Gå till Staff Dashboard
                        </Link>

                        <Link
                            href="/"
                            className="block w-full py-3 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                        >
                            Tillbaka till startsidan
                        </Link>
                    </div>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                        Felkod: 403 Forbidden • IP loggad för säkerhet
                    </p>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { resetPassword } from "./actions";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Kunde inte skicka återställningslänk. Försök igen.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Återställ lösenord</h1>
                    </div>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900">Kolla din mejl!</h2>
                        <p className="text-slate-600">
                            Vi har skickat en återställningslänk till <span className="font-medium text-slate-900">{email}</span>
                        </p>
                        <p className="text-sm text-slate-500">
                            Klicka på länken i mejlet för att välja ett nytt lösenord.
                        </p>
                        <div className="pt-4">
                            <Link
                                href="/login"
                                className="inline-block w-full px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
                            >
                                Tillbaka till inloggning
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Form State */
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-slate-600 mb-6">
                            Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    E-postadress
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        placeholder="namn@exempel.se"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? "Skickar..." : "Skicka återställningslänk"}
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

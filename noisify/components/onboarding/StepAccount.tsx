'use client'

import { useState } from 'react'
import { createAccount } from '@/actions/onboarding-actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface StepAccountProps {
    onComplete: (data: any) => void
}

export default function StepAccount({ onComplete }: StepAccountProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        // Validate
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            toast.error('Lösenorden matchar inte')
            setLoading(false)
            return
        }

        const result = await createAccount(formData)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
            return
        }

        toast.success('Konto skapat!')

        // Pass data to next step
        onComplete({
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
        })
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Kom igång med din organisation</h1>
            <p className="text-slate-600 mb-8">Skapa ett konto för att komma igång</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Förnamn <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            required
                            placeholder="Ex: Anna"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Efternamn <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            required
                            placeholder="Ex: Karlsson"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Lösenord <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Minst 6 tecken</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Bekräfta lösenord <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Mobilnummer <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <div className="w-20">
                            <input
                                type="text"
                                value="+46"
                                disabled
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 bg-slate-50 text-slate-500"
                            />
                        </div>
                        <input
                            type="tel"
                            name="phone"
                            required
                            placeholder="70 123 45 67"
                            pattern="[0-9\s-]+"
                            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Ange ditt jobbnummer om du har ett</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        E-post <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="exempel@noisify.se"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                <div className="flex items-start gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="terms" className="text-sm text-slate-600">
                        Jag accepterar terms and conditions
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Skapar konto...
                        </>
                    ) : (
                        'Skapa konto'
                    )}
                </button>

                <div className="text-center text-sm text-slate-600">
                    Har du redan ett konto?{' '}
                    <a href="/login" className="text-indigo-600 font-medium hover:underline">
                        Logga in
                    </a>
                </div>
            </form>
        </div>
    )
}

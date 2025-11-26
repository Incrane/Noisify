'use client'

import { useState } from 'react'
import { updateProfile } from '@/actions/onboarding-actions'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'

interface StepProfileProps {
    onComplete: (data: any) => void
    onBack: () => void
    initialData: any
}

export default function StepProfile({ onComplete, onBack, initialData }: StepProfileProps) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await updateProfile(formData)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
            return
        }

        toast.success('Profil uppdaterad!')
        onComplete({})
    }

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka
            </button>

            <h1 className="text-3xl font-bold text-slate-900 mb-2">Användarprofil</h1>
            <p className="text-slate-600 mb-8">Bekräfta dina uppgifter</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Förnamn
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            defaultValue={initialData.firstName}
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Efternamn
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            defaultValue={initialData.lastName}
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                        <strong>E-post:</strong> {initialData.email}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                        <strong>Mobilnummer:</strong> +46 {initialData.phone}
                    </p>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Tillbaka
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sparar...
                            </>
                        ) : (
                            'Nästa'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

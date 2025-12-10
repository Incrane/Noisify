'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganization } from '@/actions/onboarding-actions'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface StepOrganizationProps {
    onComplete: () => void
    onBack: () => void
}

export default function StepOrganization({ onComplete, onBack }: StepOrganizationProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await createOrganization(formData)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
            return
        }

        toast.success('Organisation skapad! Du kommer få ett mail när den är godkänd.')
        onComplete()

        // Redirect to staff dashboard after a brief delay
        setTimeout(() => {
            router.push('/staff')
        }, 2000)
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

            <h1 className="text-3xl font-bold text-slate-900 mb-2">Verksamhet</h1>
            <p className="text-slate-600 mb-8">Berätta om er organisation</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Verksamhetsnamn <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="orgName"
                        required
                        placeholder="Ex: Uddevalla Kommun"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Gatuadress <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="orgAddress"
                        required
                        placeholder="Ex: Storgatan 12, 123 45 Uddevalla"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Kontakt E-post
                    </label>
                    <input
                        type="email"
                        name="contactEmail"
                        placeholder="info@organisation.se"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Kontakt Telefon
                    </label>
                    <input
                        type="tel"
                        name="contactPhone"
                        placeholder="031-123 45 67"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Din verksamhetsroll <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="role"
                        required
                        placeholder="Ex: Enhetschef"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Observera:</strong> Din organisation kommer att granskas innan den blir synlig för medlemmar. Du får ett bekräftelsemail när processen är klar.
                    </p>
                </div>

                <div className="flex items-start gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="gdpr"
                        required
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="gdpr" className="text-sm text-slate-600">
                        Jag accepterar <Link href="/villkor" className="text-indigo-600 hover:underline" target="_blank">användarvillkoren</Link>
                    </label>
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
                                Skapar...
                            </>
                        ) : (
                            'Skapa konto'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

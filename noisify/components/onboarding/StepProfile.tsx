'use client'

import { useState, useRef } from 'react'
import { updateProfile, uploadUserAvatar } from '@/actions/onboarding-actions'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, User, Info } from 'lucide-react'
import Image from 'next/image'

interface StepProfileProps {
    onComplete: (data: any) => void
    onBack: () => void
    initialData: any
}

export default function StepProfile({ onComplete, onBack, initialData }: StepProfileProps) {
    const [loading, setLoading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadUserAvatar(formData)

        if (result.error) {
            toast.error(result.error)
        } else if (result.url) {
            setAvatarUrl(result.url)
            toast.success('Bild uppladdad')
        }

        setUploading(false)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const alias = formData.get('alias') as string

        // Validation: Alias cannot contain first or last name
        const firstName = initialData?.firstName?.toLowerCase() || ''
        const lastName = initialData?.lastName?.toLowerCase() || ''
        const lowerAlias = alias.toLowerCase()

        if ((firstName && lowerAlias.includes(firstName)) || (lastName && lowerAlias.includes(lastName))) {
            toast.error('Ditt alias får inte innehålla ditt för- eller efternamn för att skydda din integritet.')
            setLoading(false)
            return
        }

        // Add image URL if uploaded
        if (avatarUrl) {
            formData.append('imageUrl', avatarUrl)
        }

        const result = await updateProfile(formData)

        if (result.error) {
            toast.error(result.error)
            setLoading(false)
            return
        }

        toast.success('Profil uppdaterad!')
        onComplete({
            alias: alias,
            imageUrl: avatarUrl
        })
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
            <p className="text-slate-600 mb-4">Hur vill du synas i plattformen?</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 space-y-2">
                        <p>
                            <strong>Vad är ett alias?</strong>
                        </p>
                        <p>
                            Ett alias är ett påhittat namn som visas för andra användare istället för ditt riktiga namn.
                            Detta används för att skydda din personliga integritet.
                        </p>
                        <p>
                            Välj något unikt som inte avslöjar vem du är, t.ex. "SnabbaKatten99" eller "MusikÄlskaren".
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="relative w-32 h-32 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                                <User className="w-10 h-10 mb-1" />
                                <span className="text-xs font-medium">Ladda upp</span>
                            </div>
                        )}

                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <p className="text-sm text-slate-500">Klicka för att ladda upp bild eller välj avatar *</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Alias <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="alias"
                        required
                        placeholder="Ex: GalaxyRanger"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Får inte innehålla ditt riktiga namn.</p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

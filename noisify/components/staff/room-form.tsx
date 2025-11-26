'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Save, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { createRoom, updateRoom } from '@/app/staff/rum/actions'
import UnsplashModal from './unsplash-modal'
import Image from 'next/image'

interface RoomData {
    id?: string
    name: string
    description?: string | null
    capacity?: number | null
    image_url?: string | null
    is_bookable: boolean
    needs_approval: boolean
    org_id?: string
}

export default function RoomForm({
    initialData,
    orgId
}: {
    initialData?: RoomData
    orgId: string
}) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Form State
    const [name, setName] = useState(initialData?.name || '')
    const [description, setDescription] = useState(initialData?.description || '')
    const [capacity, setCapacity] = useState(initialData?.capacity?.toString() || '')
    const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.image_url || null)
    const [isBookable, setIsBookable] = useState(initialData?.is_bookable ?? true)
    const [needsApproval, setNeedsApproval] = useState(initialData?.needs_approval ?? false)
    
    // Unsplash State
    const [showUnsplashModal, setShowUnsplashModal] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData(event.currentTarget)

        if (selectedImage) formData.append('image_url', selectedImage)
        formData.append('is_bookable', String(isBookable))
        formData.append('needs_approval', String(needsApproval))

        // Ensure basic fields are present
        formData.set('name', name)
        formData.set('description', description)
        formData.set('capacity', capacity)

        try {
            if (initialData?.id) {
                await updateRoom(initialData.id, formData)
                router.refresh()
            } else {
                const newId = await createRoom(formData)
                router.push(`/staff/rum/${newId}`)
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Ett oväntat fel inträffade'
            setError(message)
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-24">
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-slate-500 mb-4 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" /> Tillbaka
                    </button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-slate-900">
                            {initialData ? 'Redigera Rum' : 'Lägg till nytt rum'}
                        </h1>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Sparar...' : 'Spara rum'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 text-red-600 bg-red-50 p-4 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Section */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Omslagsbild</h3>
                            <div className={`relative h-64 rounded-xl border-2 border-dashed transition-all overflow-hidden group
                                ${selectedImage ? 'border-slate-200' : 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300'}`}>
                                
                                {selectedImage ? (
                                    <>
                                        <Image src={selectedImage} alt="Room cover" fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => setShowUnsplashModal(true)}
                                                className="px-3 py-1.5 bg-white/90 text-slate-700 text-xs font-medium rounded-lg hover:bg-white shadow-sm"
                                            >
                                                Ändra
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedImage(null)}
                                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-indigo-200 mb-3" />
                                        <p className="text-slate-400 mb-4 text-sm">Ingen bild vald</p>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowUnsplashModal(true)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                                            >
                                                Välj från Unsplash
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
                             <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Grundinformation</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Rumsnamn *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                    placeholder="T.ex. Musikstudion"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Beskrivning</label>
                                <textarea
                                    name="description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm resize-y"
                                    placeholder="Beskriv rummet och vad som finns tillgängligt..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Settings */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">Inställningar</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Max antal personer</label>
                                <input
                                    type="number"
                                    name="capacity"
                                    value={capacity}
                                    onChange={e => setCapacity(e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                    placeholder="0"
                                />
                                <p className="text-xs text-slate-500 mt-1">Lämna tomt eller 0 för obegränsat</p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium text-slate-900 block">Bokningsbar</label>
                                        <p className="text-xs text-slate-500">Kan rummet bokas av medlemmar?</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsBookable(!isBookable)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${isBookable ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isBookable ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium text-slate-900 block">Kräver godkännande</label>
                                        <p className="text-xs text-slate-500">Måste personal godkänna bokningar?</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNeedsApproval(!needsApproval)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${needsApproval ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${needsApproval ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {showUnsplashModal && (
                <UnsplashModal
                    isOpen={showUnsplashModal}
                    onClose={() => setShowUnsplashModal(false)}
                    onSelect={(url) => {
                        setSelectedImage(url)
                        setShowUnsplashModal(false)
                    }}
                    orgId={orgId}
                />
            )}
        </>
    )
}

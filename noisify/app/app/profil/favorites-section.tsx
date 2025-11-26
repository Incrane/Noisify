'use client'

import { useState } from 'react'
import { Heart, Trash2, Plus, Calendar, BookOpen, Building2 } from 'lucide-react'
import { removeFavorite, FavoriteType } from './actions'
import AddFavoriteModal from './add-favorite-modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FavoritesSectionProps {
    initialFavorites: {
        activities: any[]
        courses: any[]
        organizations: any[]
    }
}

export default function FavoritesSection({ initialFavorites }: FavoritesSectionProps) {
    const [favorites, setFavorites] = useState(initialFavorites)
    const [modalOpen, setModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<FavoriteType>('activity')
    const [removingId, setRemovingId] = useState<string | null>(null)

    const handleRemove = async (type: FavoriteType, id: string) => {
        setRemovingId(id)
        try {
            await removeFavorite(type, id)
            // Optimistic update
            setFavorites(prev => ({
                ...prev,
                [type === 'activity' ? 'activities' : type === 'course' ? 'courses' : 'organizations']:
                    prev[type === 'activity' ? 'activities' : type === 'course' ? 'courses' : 'organizations']
                        .filter((item: any) =>
                            (type === 'activity' ? item.activity_id : type === 'course' ? item.course_id : item.organization_id) !== id
                        )
            }))
        } catch (error) {
            console.error(error)
        } finally {
            setRemovingId(null)
        }
    }

    const refreshFavorites = () => {
        // In a real app we might re-fetch here, but since we use server actions 
        // and revalidatePath, the page will reload with fresh data.
        // However, for client-side smoothness we could just close the modal.
        // The parent page refresh will handle the data update.
        // Actually, since we are in a client component, we might not see the update immediately 
        // unless the parent passes new props or we router.refresh().
        // Let's use router.refresh() pattern if needed, but for now relying on revalidatePath 
        // might require a router.refresh() call here.
        window.location.reload() // Simple but effective for now to ensure data sync
    }

    const renderList = (items: any[], type: FavoriteType) => {
        if (items.length === 0) {
            return (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Heart className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Inga favoriter än</p>
                    <button
                        onClick={() => { setActiveTab(type); setModalOpen(true); }}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                        Lägg till {type === 'activity' ? 'aktivitet' : type === 'course' ? 'kurs' : 'organisation'}
                    </button>
                </div>
            )
        }

        return (
            <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => {
                    const entity = type === 'activity' ? item.activity : type === 'course' ? item.course : item.organization
                    const id = type === 'activity' ? item.activity_id : type === 'course' ? item.course_id : item.organization_id

                    if (!entity) return null

                    return (
                        <div key={id} className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {(entity.image_url || entity.logo_url) ? (
                                    <img src={entity.image_url || entity.logo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-400 font-bold text-lg">
                                        {(entity.title || entity.name || entity.org_namn || '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 truncate">
                                    {entity.title || entity.name || entity.org_namn}
                                </h4>
                                <p className="text-xs text-slate-500 truncate">
                                    {type === 'activity' ? 'Aktivitet' : type === 'course' ? 'Kurs' : 'Organisation'}
                                </p>
                            </div>
                            <button
                                onClick={() => handleRemove(type, id)}
                                disabled={removingId === id}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Ta bort från favoriter"
                            >
                                {removingId === id ? (
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Favoriter
                </h3>
                <button
                    onClick={() => setModalOpen(true)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> Lägg till
                </button>
            </div>

            <Tabs defaultValue="activity" value={activeTab} onValueChange={(v) => setActiveTab(v as FavoriteType)} className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-6">
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Aktiviteter</span>
                    </TabsTrigger>
                    <TabsTrigger value="course" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">Kurser</span>
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Organisationer</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="mt-0">
                    {renderList(favorites.activities, 'activity')}
                </TabsContent>
                <TabsContent value="course" className="mt-0">
                    {renderList(favorites.courses, 'course')}
                </TabsContent>
                <TabsContent value="organization" className="mt-0">
                    {renderList(favorites.organizations, 'organization')}
                </TabsContent>
            </Tabs>

            <AddFavoriteModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                type={activeTab}
                onAdded={refreshFavorites}
            />
        </div>
    )
}

'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/app/profil/actions'
import { Pencil, Loader2 } from 'lucide-react'
import AvatarPicker from '@/components/profile/avatar-picker'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface ProfileHeaderProps {
    profile: any
    user: any
    avatars: { name: string; url: string }[]
}

export default function ProfileHeader({ profile, user, avatars }: ProfileHeaderProps) {
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleAvatarSelect = async (url: string) => {
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('alias', profile.alias) // Alias is required by updateProfile
            formData.append('avatar_url', url)

            await updateProfile(formData)
            setIsAvatarModalOpen(false)
            toast.success("Avatar uppdaterad")
        } catch (error) {
            console.error(error)
            toast.error("Kunde inte uppdatera avatar")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-indigo-600 h-32 relative">
                    <div className="absolute -bottom-12 left-8 group">
                        <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-md">
                            {profile?.image_url ? (
                                <img
                                    src={profile.image_url}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover bg-slate-100"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                                    {profile?.alias?.charAt(0).toUpperCase() ||
                                        user.email?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Edit Button Overlay */}
                            <button
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                title="Ändra avatar"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="pt-16 p-8 space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {profile?.alias || "Inget alias"}
                        </h2>
                        <p className="text-slate-500">{user.email}</p>
                    </div>
                </div>
            </div>

            <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Välj Avatar</DialogTitle>
                        <DialogDescription>
                            Välj en ny avatar från listan nedan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            </div>
                        ) : (
                            <AvatarPicker
                                avatars={avatars}
                                selectedAvatar={profile?.image_url}
                                onSelect={handleAvatarSelect}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

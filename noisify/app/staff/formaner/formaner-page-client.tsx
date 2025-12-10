'use client'

import { useState } from 'react'
import { Plus, Search, Gift, Star, DoorOpen, Percent, MoreHorizontal, Users, BookOpen, Building2, Sparkles, Trash2, Pencil, Share2, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { PerkType, PerkTypeShare } from './actions'
import { PerkTypeModal } from './perk-type-modal'
import { PerkUsersModal } from './perk-users-modal'
import { SharePerkModal } from './share-perk-modal'
import { PendingInvitesCard } from './pending-invites-card'
import { deletePerkType } from './actions'
import { toast } from 'sonner'

interface FormanerPageClientProps {
    initialPerkTypes: PerkType[]
    initialPendingInvites: PerkTypeShare[]
    userRoleId: number
    orgId: string
}

const categoryIcons = {
    'ROOM_ACCESS': DoorOpen,
    'DISCOUNT': Percent,
    'PRIORITY_BOOKING': Star,
    'OTHER': Gift
}

const categoryLabels = {
    'ROOM_ACCESS': 'Rumsåtkomst',
    'DISCOUNT': 'Rabatt',
    'PRIORITY_BOOKING': 'Prioriterad bokning',
    'OTHER': 'Övrigt'
}

const categoryColors = {
    'ROOM_ACCESS': 'bg-blue-100 text-blue-700',
    'DISCOUNT': 'bg-green-100 text-green-700',
    'PRIORITY_BOOKING': 'bg-amber-100 text-amber-700',
    'OTHER': 'bg-slate-100 text-slate-700'
}

export function FormanerPageClient({
    initialPerkTypes,
    initialPendingInvites,
    userRoleId,
    orgId
}: FormanerPageClientProps) {
    const [perkTypes, setPerkTypes] = useState<PerkType[]>(initialPerkTypes)
    const [pendingInvites, setPendingInvites] = useState<PerkTypeShare[]>(initialPendingInvites)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editingPerk, setEditingPerk] = useState<PerkType | null>(null)
    const [viewingUsersPerk, setViewingUsersPerk] = useState<PerkType | null>(null)
    const [sharingPerk, setSharingPerk] = useState<PerkType | null>(null)

    const canManage = userRoleId >= 2
    const canDelete = userRoleId >= 3

    // Filter perk types
    const filteredPerkTypes = perkTypes.filter(perk => {
        const matchesSearch = perk.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (perk.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        const matchesCategory = categoryFilter === 'all' || perk.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    const handleDeletePerk = async (perk: PerkType) => {
        if (!confirm(`Är du säker på att du vill ta bort "${perk.name}"?`)) return

        const result = await deletePerkType(perk.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Förmånen har tagits bort')
            setPerkTypes(prev => prev.filter(p => p.id !== perk.id))
        }
    }

    const handlePerkCreatedOrUpdated = (perk: PerkType, isNew: boolean) => {
        if (isNew) {
            setPerkTypes(prev => [...prev, perk])
        } else {
            setPerkTypes(prev => prev.map(p => p.id === perk.id ? perk : p))
        }
    }

    const handleInviteResponded = (inviteId: string) => {
        setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-7 h-7 text-indigo-600" />
                        Förmåner
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Hantera förmåner som kan tilldelas medlemmar för att ge tillgång till rum, kurser och mer.
                    </p>
                </div>
                {canManage && (
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Skapa förmån
                    </Button>
                )}
            </div>

            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
                <PendingInvitesCard
                    invites={pendingInvites}
                    onResponded={handleInviteResponded}
                />
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Sök förmåner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Alla kategorier" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Alla kategorier</SelectItem>
                        <SelectItem value="ROOM_ACCESS">Rumsåtkomst</SelectItem>
                        <SelectItem value="DISCOUNT">Rabatt</SelectItem>
                        <SelectItem value="PRIORITY_BOOKING">Prioriterad bokning</SelectItem>
                        <SelectItem value="OTHER">Övrigt</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Perk Types Grid */}
            {filteredPerkTypes.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">Inga förmåner hittades</h3>
                    <p className="text-slate-500 mt-1">
                        {perkTypes.length === 0
                            ? 'Skapa din första förmån för att komma igång.'
                            : 'Prova att ändra dina filter.'}
                    </p>
                    {canManage && perkTypes.length === 0 && (
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-4"
                            variant="outline"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Skapa förmån
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPerkTypes.map((perk) => {
                        const CategoryIcon = categoryIcons[perk.category]
                        return (
                            <div
                                key={perk.id}
                                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[perk.category]}`}>
                                            <CategoryIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{perk.name}</h3>
                                            <Badge variant="secondary" className="text-xs mt-1">
                                                {categoryLabels[perk.category]}
                                            </Badge>
                                        </div>
                                    </div>

                                    {canManage && perk.is_owned && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewingUsersPerk(perk)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Visa användare
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditingPerk(perk)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Redigera
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSharingPerk(perk)}>
                                                    <Share2 className="w-4 h-4 mr-2" />
                                                    Dela med organisation
                                                </DropdownMenuItem>
                                                {canDelete && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeletePerk(perk)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Ta bort
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                {perk.description && (
                                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                                        {perk.description}
                                    </p>
                                )}

                                {perk.is_shared && perk.shared_by_org_name && (
                                    <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-500">
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>Delad från {perk.shared_by_org_name}</span>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        <span>{perk.user_count} användare</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <DoorOpen className="w-4 h-4 text-slate-400" />
                                        <span>{perk.room_count} rum</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <BookOpen className="w-4 h-4 text-slate-400" />
                                        <span>{perk.course_count} kurser</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modals */}
            <PerkTypeModal
                isOpen={isCreateModalOpen || editingPerk !== null}
                onClose={() => {
                    setIsCreateModalOpen(false)
                    setEditingPerk(null)
                }}
                perkType={editingPerk}
                onSaved={handlePerkCreatedOrUpdated}
            />

            {viewingUsersPerk && (
                <PerkUsersModal
                    isOpen={true}
                    onClose={() => setViewingUsersPerk(null)}
                    perkType={viewingUsersPerk}
                />
            )}

            {sharingPerk && (
                <SharePerkModal
                    isOpen={true}
                    onClose={() => setSharingPerk(null)}
                    perkType={sharingPerk}
                />
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Sparkles, Loader2, Gift, DoorOpen, Percent, Star, Plus, X, Clock, Check } from 'lucide-react'
import { getUserPerks, grantPerkToUser, revokeUserPerk, getPerkTypes, UserPerk, PerkType } from '@/app/staff/formaner/actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

interface MemberPerksModalProps {
    isOpen: boolean
    onClose: () => void
    memberId: string // profile_id
    memberAlias: string
    orgId: string
}

const categoryIcons = {
    'ROOM_ACCESS': DoorOpen,
    'DISCOUNT': Percent,
    'PRIORITY_BOOKING': Star,
    'OTHER': Gift
}

const statusLabels = {
    'ACTIVE': { label: 'Aktiv', color: 'bg-green-100 text-green-700 border-green-200' },
    'EXPIRED': { label: 'Utgången', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    'REVOKED': { label: 'Återkallad', color: 'bg-red-100 text-red-600 border-red-200' }
}

const sourceLabels = {
    'manual': 'Manuellt tilldelad',
    'course': 'Kurs',
    'membership': 'Medlemskap',
    'event': 'Aktivitet'
}

export function MemberPerksModal({ isOpen, onClose, memberId, memberAlias, orgId }: MemberPerksModalProps) {
    const [userPerks, setUserPerks] = useState<UserPerk[]>([])
    const [availablePerks, setAvailablePerks] = useState<PerkType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isGranting, setIsGranting] = useState(false)
    const [revokingId, setRevokingId] = useState<string | null>(null)
    const [showGrantForm, setShowGrantForm] = useState(false)
    const [selectedPerkTypeId, setSelectedPerkTypeId] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            loadData()
        }
    }, [isOpen, memberId])

    const loadData = async () => {
        setIsLoading(true)

        const [perksResult, perkTypesResult] = await Promise.all([
            getUserPerks(memberId),
            getPerkTypes(orgId)
        ])

        if (perksResult.data) {
            setUserPerks(perksResult.data)
        }
        if (perkTypesResult.data) {
            setAvailablePerks(perkTypesResult.data)
        }

        setIsLoading(false)
    }

    const handleGrant = async () => {
        if (!selectedPerkTypeId) {
            toast.error('Välj en förmån')
            return
        }

        setIsGranting(true)
        const result = await grantPerkToUser(memberId, selectedPerkTypeId)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Förmånen har tilldelats')
            setShowGrantForm(false)
            setSelectedPerkTypeId('')
            loadData() // Refresh
        }
        setIsGranting(false)
    }

    const handleRevoke = async (perk: UserPerk) => {
        if (!confirm(`Är du säker på att du vill återkalla "${perk.perk_name}" från ${memberAlias}?`)) return

        setRevokingId(perk.id)
        const result = await revokeUserPerk(perk.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Förmånen har återkallats')
            setUserPerks(prev => prev.map(p =>
                p.id === perk.id ? { ...p, status: 'REVOKED' as const } : p
            ))
        }
        setRevokingId(null)
    }

    const activePerks = userPerks.filter(p => p.status === 'ACTIVE')
    const otherPerks = userPerks.filter(p => p.status !== 'ACTIVE')

    // Get available perks that user doesn't already have (active)
    const activeUserPerkTypeIds = new Set(activePerks.map(p => p.perk_type_id))
    const grantablePerks = availablePerks.filter(p => !activeUserPerkTypeIds.has(p.id))

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Förmåner - {memberAlias}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Grant Form */}
                        {showGrantForm ? (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-indigo-900">Tilldela förmån</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setShowGrantForm(false); setSelectedPerkTypeId(''); }}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                {grantablePerks.length === 0 ? (
                                    <p className="text-sm text-indigo-700">
                                        {memberAlias} har redan alla tillgängliga förmåner, eller inga förmåner har skapats än.
                                    </p>
                                ) : (
                                    <>
                                        <Select value={selectedPerkTypeId} onValueChange={setSelectedPerkTypeId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Välj förmån..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {grantablePerks.map((perk) => {
                                                    const Icon = categoryIcons[perk.category]
                                                    return (
                                                        <SelectItem key={perk.id} value={perk.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-4 h-4 text-slate-400" />
                                                                <span>{perk.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            onClick={handleGrant}
                                            disabled={isGranting || !selectedPerkTypeId}
                                            className="w-full"
                                        >
                                            {isGranting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            <Check className="w-4 h-4 mr-2" />
                                            Tilldela
                                        </Button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setShowGrantForm(true)}
                                className="w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tilldela förmån
                            </Button>
                        )}

                        {/* Active Perks */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                Aktiva förmåner
                                {activePerks.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">{activePerks.length}</Badge>
                                )}
                            </h4>

                            {activePerks.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <Gift className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Inga aktiva förmåner</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activePerks.map((perk) => {
                                        const Icon = categoryIcons[perk.perk_category]
                                        const statusInfo = statusLabels[perk.status]

                                        return (
                                            <div
                                                key={perk.id}
                                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{perk.perk_name}</p>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                            <span>{sourceLabels[perk.source_type]}</span>
                                                            {perk.granted_at && (
                                                                <>
                                                                    <span>•</span>
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>{formatDistanceToNow(new Date(perk.granted_at), { addSuffix: true, locale: sv })}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRevoke(perk)}
                                                    disabled={revokingId === perk.id}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                                >
                                                    {revokingId === perk.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <X className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Other Perks (Expired/Revoked) */}
                        {otherPerks.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-500 mb-3">
                                    Tidigare förmåner ({otherPerks.length})
                                </h4>
                                <div className="space-y-2">
                                    {otherPerks.map((perk) => {
                                        const Icon = categoryIcons[perk.perk_category]
                                        const statusInfo = statusLabels[perk.status]

                                        return (
                                            <div
                                                key={perk.id}
                                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-600">{perk.perk_name}</p>
                                                        <Badge variant="outline" className={`text-xs mt-1 ${statusInfo.color}`}>
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Stäng
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

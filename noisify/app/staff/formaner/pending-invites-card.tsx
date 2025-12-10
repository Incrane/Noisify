'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, X, Loader2, Building2 } from 'lucide-react'
import { PerkTypeShare, respondToPerkInvite } from './actions'
import { toast } from 'sonner'

interface PendingInvitesCardProps {
    invites: PerkTypeShare[]
    onResponded: (inviteId: string) => void
}

export function PendingInvitesCard({ invites, onResponded }: PendingInvitesCardProps) {
    const [respondingId, setRespondingId] = useState<string | null>(null)

    const handleRespond = async (invite: PerkTypeShare, accept: boolean) => {
        setRespondingId(invite.id)

        const result = await respondToPerkInvite(invite.id, accept)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(accept ? 'Inbjudan accepterad' : 'Inbjudan avvisad')
            onResponded(invite.id)
        }

        setRespondingId(null)
    }

    if (invites.length === 0) return null

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-900">
                    Inkommande inbjudningar ({invites.length})
                </h3>
            </div>

            <div className="space-y-3">
                {invites.map((invite) => {
                    const perkType = invite.perk_type as unknown as { name?: string; description?: string } | undefined
                    const invitedByOrg = invite.invited_by_org as unknown as { name?: string } | undefined

                    return (
                        <div
                            key={invite.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-amber-100"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900">
                                        {perkType?.name || 'Okänd förmån'}
                                    </span>
                                    <Badge variant="secondary" className="text-xs">Ny</Badge>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
                                    <Building2 className="w-3.5 h-3.5" />
                                    <span>
                                        Från {invitedByOrg?.name || 'Okänd organisation'}
                                    </span>
                                </div>
                                {perkType?.description && (
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                        {perkType.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRespond(invite, false)}
                                    disabled={respondingId === invite.id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                    {respondingId === invite.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <X className="w-4 h-4 mr-1" />
                                            Avvisa
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleRespond(invite, true)}
                                    disabled={respondingId === invite.id}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {respondingId === invite.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-1" />
                                            Acceptera
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

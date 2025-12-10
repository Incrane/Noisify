'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Loader2, X, Clock } from 'lucide-react'
import { PerkType, getPerkTypeUsers, revokeUserPerk } from './actions'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

interface PerkUsersModalProps {
    isOpen: boolean
    onClose: () => void
    perkType: PerkType
}

interface PerkUser {
    id: string
    alias: string
    status: string
    granted_at: string
}

export function PerkUsersModal({ isOpen, onClose, perkType }: PerkUsersModalProps) {
    const [users, setUsers] = useState<PerkUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [revokingId, setRevokingId] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            loadUsers()
        }
    }, [isOpen, perkType.id])

    const loadUsers = async () => {
        setIsLoading(true)
        const result = await getPerkTypeUsers(perkType.id)
        if (result.data) {
            setUsers(result.data)
        }
        setIsLoading(false)
    }

    const handleRevoke = async (user: PerkUser) => {
        if (!confirm(`Är du säker på att du vill återkalla förmånen från ${user.alias}?`)) return

        setRevokingId(user.id)
        const result = await revokeUserPerk(user.id)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Förmånen har återkallats')
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, status: 'REVOKED' } : u
            ))
        }
        setRevokingId(null)
    }

    const activeUsers = users.filter(u => u.status === 'ACTIVE')
    const revokedUsers = users.filter(u => u.status === 'REVOKED')
    const expiredUsers = users.filter(u => u.status === 'EXPIRED')

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Användare med {perkType.name}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600">Inga användare har denna förmån</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Active Users */}
                        {activeUsers.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-2">
                                    Aktiva ({activeUsers.length})
                                </h4>
                                <div className="space-y-2">
                                    {activeUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">{user.alias}</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        Tilldelad {formatDistanceToNow(new Date(user.granted_at), { addSuffix: true, locale: sv })}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRevoke(user)}
                                                disabled={revokingId === user.id}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                {revokingId === user.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <X className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expired/Revoked Users */}
                        {(expiredUsers.length > 0 || revokedUsers.length > 0) && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 mb-2">
                                    Inaktiva ({expiredUsers.length + revokedUsers.length})
                                </h4>
                                <div className="space-y-2">
                                    {[...revokedUsers, ...expiredUsers].map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-600">{user.alias}</p>
                                                <Badge variant="secondary" className="text-xs mt-1">
                                                    {user.status === 'REVOKED' ? 'Återkallad' : 'Utgången'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

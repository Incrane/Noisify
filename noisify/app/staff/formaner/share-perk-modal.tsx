'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Share2, Loader2, Building2 } from 'lucide-react'
import { PerkType, getOrganizationsList, inviteOrgToPerk } from './actions'
import { toast } from 'sonner'

interface SharePerkModalProps {
    isOpen: boolean
    onClose: () => void
    perkType: PerkType
}

export function SharePerkModal({ isOpen, onClose, perkType }: SharePerkModalProps) {
    const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadOrganizations()
        }
    }, [isOpen])

    const loadOrganizations = async () => {
        setIsLoading(true)
        const result = await getOrganizationsList()
        if (result.data) {
            setOrganizations(result.data)
        }
        setIsLoading(false)
    }

    const handleSubmit = async () => {
        if (!selectedOrgId) {
            toast.error('Välj en organisation')
            return
        }

        setIsSending(true)
        const result = await inviteOrgToPerk(perkType.id, selectedOrgId)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Inbjudan har skickats')
            handleClose()
        }
        setIsSending(false)
    }

    const handleClose = () => {
        setSelectedOrgId('')
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-indigo-600" />
                        Dela &quot;{perkType.name}&quot;
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-slate-600 mb-4">
                        Bjud in en annan organisation att använda denna förmån. De kommer att kunna tilldela den till sina medlemmar.
                    </p>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : organizations.length === 0 ? (
                        <div className="text-center py-8">
                            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600">Inga andra organisationer tillgängliga</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">
                                Välj organisation
                            </label>
                            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Välj en organisation..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                <span>{org.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isSending}>
                        Avbryt
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSending || !selectedOrgId || isLoading}
                    >
                        {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Skicka inbjudan
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

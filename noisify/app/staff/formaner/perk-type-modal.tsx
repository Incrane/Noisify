'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Gift, DoorOpen, Percent, Star, Loader2 } from 'lucide-react'
import { PerkType, CreatePerkTypeData, createPerkType, updatePerkType } from './actions'
import { toast } from 'sonner'

interface PerkTypeModalProps {
    isOpen: boolean
    onClose: () => void
    perkType?: PerkType | null
    onSaved: (perk: PerkType, isNew: boolean) => void
}

const categoryOptions = [
    { value: 'ROOM_ACCESS', label: 'Rumsåtkomst', icon: DoorOpen, description: 'Ger tillgång till att boka specifika rum' },
    { value: 'DISCOUNT', label: 'Rabatt', icon: Percent, description: 'Ger rabatter på aktiviteter eller tjänster' },
    { value: 'PRIORITY_BOOKING', label: 'Prioriterad bokning', icon: Star, description: 'Ger förtur vid bokningar' },
    { value: 'OTHER', label: 'Övrigt', icon: Gift, description: 'Övriga förmåner' }
]

export function PerkTypeModal({ isOpen, onClose, perkType, onSaved }: PerkTypeModalProps) {
    const isEditing = perkType !== null && perkType !== undefined

    const [name, setName] = useState(perkType?.name || '')
    const [description, setDescription] = useState(perkType?.description || '')
    const [category, setCategory] = useState<CreatePerkTypeData['category']>(perkType?.category || 'OTHER')
    const [icon, setIcon] = useState(perkType?.icon || '')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Namn är obligatoriskt')
            return
        }

        setIsLoading(true)

        try {
            if (isEditing && perkType) {
                const result = await updatePerkType(perkType.id, {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    category,
                    icon: icon.trim() || undefined
                })

                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Förmånen har uppdaterats')
                    onSaved({
                        ...perkType,
                        name: name.trim(),
                        description: description.trim() || null,
                        category,
                        icon: icon.trim() || null
                    }, false)
                    handleClose()
                }
            } else {
                const result = await createPerkType({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    category,
                    icon: icon.trim() || undefined
                })

                if (result.error) {
                    toast.error(result.error)
                } else if (result.data) {
                    toast.success('Förmånen har skapats')
                    onSaved(result.data, true)
                    handleClose()
                }
            }
        } catch {
            toast.error('Ett fel uppstod')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setName('')
        setDescription('')
        setCategory('OTHER')
        setIcon('')
        onClose()
    }

    // Reset form when perkType changes
    useState(() => {
        if (perkType) {
            setName(perkType.name)
            setDescription(perkType.description || '')
            setCategory(perkType.category)
            setIcon(perkType.icon || '')
        } else {
            setName('')
            setDescription('')
            setCategory('OTHER')
            setIcon('')
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Redigera förmån' : 'Skapa ny förmån'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Namn *</Label>
                        <Input
                            id="name"
                            placeholder="T.ex. Musikstudio-access"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori *</Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as CreatePerkTypeData['category'])} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {categoryOptions.map((opt) => {
                                    const Icon = opt.icon
                                    return (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                <span>{opt.label}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                            {categoryOptions.find(o => o.value === category)?.description}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Beskrivning</Label>
                        <Textarea
                            id="description"
                            placeholder="Beskriv vad denna förmån ger tillgång till..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="icon">Ikon (valfritt)</Label>
                        <Input
                            id="icon"
                            placeholder="T.ex. music, gamepad, star"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-slate-500">
                            Ange ett ikonnamn för visuell representation
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                            Avbryt
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? 'Spara ändringar' : 'Skapa förmån'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

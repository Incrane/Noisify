'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { completeOnboarding, uploadOrgLogo } from '@/actions/onboarding-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Check, ChevronRight, ChevronLeft, Upload, MapPin, Clock, Share2, Building2, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import UnsplashModal from '@/components/staff/unsplash-modal'

interface OnboardingWizardProps {
    initialData: any
}

const STEPS = [
    { id: 'details', title: 'Om Verksamheten', icon: Building2 },
    { id: 'location', title: 'Plats & Kontakt', icon: MapPin },
    { id: 'hours', title: 'Öppettider', icon: Clock },
    { id: 'social', title: 'Sociala Medier', icon: Share2 },
    { id: 'review', title: 'Granska', icon: Check },
]

const DAYS = [
    { id: 'monday', label: 'Måndag' },
    { id: 'tuesday', label: 'Tisdag' },
    { id: 'wednesday', label: 'Onsdag' },
    { id: 'thursday', label: 'Torsdag' },
    { id: 'friday', label: 'Fredag' },
    { id: 'saturday', label: 'Lördag' },
    { id: 'sunday', label: 'Söndag' },
]

export default function OnboardingWizard({ initialData }: OnboardingWizardProps) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showUnsplash, setShowUnsplash] = useState(false)

    const [formData, setFormData] = useState({
        name: initialData.name || '',
        description: initialData.description || '',
        logo_url: initialData.logo_url || '',
        address: initialData.org_address || '',
        email: initialData.contact_email || '',
        phone: initialData.contact_phone || '',
        opening_hours: initialData.opening_hours || {},
        social_links: initialData.social_links || { instagram: '', facebook: '', tiktok: '', website: '' }
    })

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const data = new FormData()
        data.append('file', file)

        const result = await uploadOrgLogo(data)
        setIsUploading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            setFormData(prev => ({ ...prev, logo_url: result.url }))
            toast.success('Logotyp uppladdad')
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        const result = await completeOnboarding(initialData.id, {
            description: formData.description,
            logo_url: formData.logo_url,
            opening_hours: formData.opening_hours,
            social_links: formData.social_links
        })

        if (result.error) {
            toast.error(result.error)
            setIsSubmitting(false)
        } else {
            toast.success('Onboarding slutförd!')
            router.push('/staff')
        }
    }

    const updateOpeningHours = (day: string, type: 'open' | 'close' | 'closed', value: any) => {
        setFormData(prev => {
            const currentDay = prev.opening_hours?.[day] || { open: '', close: '', closed: false }
            const updatedDay = { ...currentDay, [type]: value }

            // If setting closed to true, clear times
            if (type === 'closed' && value === true) {
                updatedDay.open = ''
                updatedDay.close = ''
            }

            return {
                ...prev,
                opening_hours: {
                    ...prev.opening_hours,
                    [day]: updatedDay
                }
            }
        })
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Details
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Verksamhetens Namn</Label>
                            <Input value={formData.name} disabled className="bg-slate-50" />
                            <p className="text-xs text-slate-500">Namnet kan inte ändras här.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Beskrivning</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Beskriv er verksamhet..."
                                className="min-h-[120px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Logotyp</Label>
                            <div className="flex items-start gap-4">
                                <div className="relative w-32 h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                                    {formData.logo_url ? (
                                        <Image src={formData.logo_url} alt="Logo" fill className="object-cover" />
                                    ) : (
                                        <Building2 className="w-10 h-10 text-slate-300" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="relative" disabled={isUploading}>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                                accept="image/*"
                                            />
                                            <Upload className="w-4 h-4 mr-2" />
                                            {isUploading ? 'Laddar upp...' : 'Ladda upp bild'}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setShowUnsplash(true)}>
                                            <ImageIcon className="w-4 h-4 mr-2" />
                                            Välj från Unsplash
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500">Rekommenderad storlek: 500x500px</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 1: // Location
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Adress</Label>
                            <Input
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Gatuadress 1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>E-post (Kontakt)</Label>
                                <Input
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="kontakt@exempel.se"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Telefon (Kontakt)</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="031-123 45 67"
                                />
                            </div>
                        </div>
                    </div>
                )

            case 2: // Hours
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 mb-4">Ange ordinarie öppettider. Lämna tomt eller markera som stängt för dagar ni inte har öppet.</p>
                        <div className="grid gap-4">
                            {DAYS.map(day => {
                                const dayData = formData.opening_hours?.[day.id] || {}
                                return (
                                    <div key={day.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="w-24 font-medium text-sm">{day.label}</div>
                                        <div className="flex-1 flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={dayData.open || ''}
                                                onChange={e => updateOpeningHours(day.id, 'open', e.target.value)}
                                                disabled={dayData.closed}
                                                className="w-32"
                                            />
                                            <span className="text-slate-400">-</span>
                                            <Input
                                                type="time"
                                                value={dayData.close || ''}
                                                onChange={e => updateOpeningHours(day.id, 'close', e.target.value)}
                                                disabled={dayData.closed}
                                                className="w-32"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`closed-${day.id}`}
                                                checked={dayData.closed || false}
                                                onChange={e => updateOpeningHours(day.id, 'closed', e.target.checked)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <Label htmlFor={`closed-${day.id}`} className="text-sm cursor-pointer">Stängt</Label>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )

            case 3: // Social
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Hemsida</Label>
                            <Input
                                value={formData.social_links.website}
                                onChange={e => setFormData({ ...formData, social_links: { ...formData.social_links, website: e.target.value } })}
                                placeholder="https://www.exempel.se"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Instagram</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">instagram.com/</span>
                                <Input
                                    className="pl-32"
                                    value={formData.social_links.instagram}
                                    onChange={e => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                                    placeholder="anvandarnamn"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Facebook</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">facebook.com/</span>
                                <Input
                                    className="pl-32"
                                    value={formData.social_links.facebook}
                                    onChange={e => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                                    placeholder="sida"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>TikTok</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">tiktok.com/@</span>
                                <Input
                                    className="pl-28"
                                    value={formData.social_links.tiktok}
                                    onChange={e => setFormData({ ...formData, social_links: { ...formData.social_links, tiktok: e.target.value } })}
                                    placeholder="anvandarnamn"
                                />
                            </div>
                        </div>
                    </div>
                )

            case 4: // Review
                return (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 bg-white rounded-full overflow-hidden border border-slate-200 shadow-sm">
                                    {formData.logo_url ? (
                                        <Image src={formData.logo_url} alt="Logo" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                            <Building2 className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{formData.name}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-2">{formData.description || 'Ingen beskrivning'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                                <div>
                                    <h4 className="font-medium text-sm text-slate-900 mb-1">Kontakt</h4>
                                    <p className="text-sm text-slate-600">{formData.email}</p>
                                    <p className="text-sm text-slate-600">{formData.phone}</p>
                                    <p className="text-sm text-slate-600">{formData.address}</p>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm text-slate-900 mb-1">Socialt</h4>
                                    {Object.entries(formData.social_links as Record<string, string>).map(([key, value]) => (
                                        value ? <p key={key} className="text-sm text-slate-600 capitalize">{key}: {value}</p> : null
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-slate-500 text-sm">
                            Kontrollera att allt ser rätt ut. Du kan alltid ändra uppgifterna senare under Inställningar.
                        </p>
                    </div>
                )
        }
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            {/* Progress Steps */}
            <div className="mb-12">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10" />
                    {STEPS.map((step, index) => {
                        const Icon = step.icon
                        const isActive = index === currentStep
                        const isCompleted = index < currentStep

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                                <div
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${isActive ? 'border-indigo-600 bg-indigo-50 text-indigo-600' :
                                            isCompleted ? 'border-indigo-600 bg-indigo-600 text-white' :
                                                'border-slate-200 bg-white text-slate-300'}
                  `}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <Card className="p-8 shadow-lg border-slate-100">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">{STEPS[currentStep].title}</h2>
                </div>

                {renderStepContent()}

                <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0 || isSubmitting}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Tillbaka
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                    >
                        {isSubmitting ? (
                            'Sparar...'
                        ) : currentStep === STEPS.length - 1 ? (
                            <>Slutför <Check className="w-4 h-4 ml-2" /></>
                        ) : (
                            <>Nästa <ChevronRight className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                </div>
            </Card>

            <UnsplashModal
                isOpen={showUnsplash}
                onClose={() => setShowUnsplash(false)}
                onSelect={(url) => {
                    setFormData(prev => ({ ...prev, logo_url: url }))
                    setShowUnsplash(false)
                }}
                orgId={initialData.id}
            />
        </div>
    )
}

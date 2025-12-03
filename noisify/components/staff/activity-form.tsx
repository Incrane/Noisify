'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createActivity, updateActivity } from '@/app/staff/aktiviteter/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, isSameDay } from "date-fns"
import { sv } from "date-fns/locale"
import { CalendarIcon, Loader2, Upload, X, AlertCircle, Info, Trash2, Zap, Clock, MapPin, Users, Link as LinkIcon, Dices, FileText, Eye, Map } from "lucide-react"
import { toast } from "sonner"
import RichTextEditor from '@/components/ui/rich-text-editor'
import { MultiSelect } from '@/components/ui/multi-select'
import { DatePicker } from '@/components/ui/date-picker'
import UnsplashModal from './unsplash-modal'
import ActivityPreviewModal from './activity-preview-modal'
import MemberSearch from './member-search'
import { TimePicker } from '@/components/ui/time-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Types
interface Organization {
    id: string
    org_namn: string
}

interface Category {
    id: string
    category_name: string
}

interface TargetSubgroup {
    id: string
    subgroup_name: string
}

interface StaffMember {
    profile_id: string
    alias: string
    public_name: string
}

interface Gender {
    id: string
    gender: string
}

interface ActivityInitialData {
    activity_id?: string
    aktivitet?: string
    beskrivning?: string
    owner_org_id?: string
    start_datum_tid?: string
    slut_datum_tid?: string
    total_kapacitet?: number
    plats?: string
    category_id?: string
    target_subgroups?: string[]
    created_by?: string
    image_url?: string | null
    reservplatser?: number
    anmalningsfrist?: string | null
    min_age?: number | null
    max_age?: number | null
    activity_type?: 'NORMAL' | 'RANDOM'
    lottery_date?: string | null
    confirmation_deadline?: string | null
    genders?: string[]
    rrule?: string | null
    registration_slip_url?: string | null
    collaborators?: string[]
    hide_address?: boolean
    registration_rules?: string
}

interface ActivityFormProps {
    organizations: Organization[]
    categories: Category[]
    targetSubgroups: TargetSubgroup[]
    staffMembers: StaffMember[]
    initialOrgId?: string
    initialData?: ActivityInitialData
    allOrganizations: any[]
    genders: Gender[]
}

export default function ActivityForm({
    organizations,
    categories,
    targetSubgroups,
    staffMembers,
    initialOrgId,
    initialData,
    allOrganizations,
    genders
}: ActivityFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    // Form State
    const [name, setName] = useState(initialData?.aktivitet || '')
    const [description, setDescription] = useState(initialData?.beskrivning || '')
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialData?.category_id ? [initialData.category_id] : [])
    const [selectedTargetGroups, setSelectedTargetGroups] = useState<string[]>(initialData?.target_subgroups || [])
    const [selectedContacts, setSelectedContacts] = useState<string[]>(initialData?.created_by ? [initialData.created_by] : [])
    const [address, setAddress] = useState(initialData?.plats || '')
    const [selectedOrgId, setSelectedOrgId] = useState(initialData?.owner_org_id || initialOrgId || organizations[0]?.id)
    const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(initialData?.collaborators || [])
    const [hideAddress, setHideAddress] = useState(initialData?.hide_address || false)

    // Registration Rules
    const [registrationRule, setRegistrationRule] = useState(initialData?.registration_rules || 'OPEN_FOR_ALL')
    const [invitedMembers, setInvitedMembers] = useState<{ id: string, alias: string }[]>([])

    // Dates
    const [startDate, setStartDate] = useState<Date | undefined>(initialData?.start_datum_tid ? new Date(initialData.start_datum_tid) : undefined)
    const [startTime, setStartTime] = useState(initialData?.start_datum_tid?.split('T')[1]?.slice(0, 5) || '')
    const [endDate, setEndDate] = useState<Date | undefined>(initialData?.slut_datum_tid ? new Date(initialData.slut_datum_tid) : undefined)
    const [endTime, setEndTime] = useState(initialData?.slut_datum_tid?.split('T')[1]?.slice(0, 5) || '')

    // Capacity
    const [capacity, setCapacity] = useState(initialData?.total_kapacitet?.toString() || '')

    // Unsplash State
    const [showUnsplashModal, setShowUnsplashModal] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.image_url || null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // PowerUps State
    const [showWaitlist, setShowWaitlist] = useState(!!initialData?.reservplatser)
    const [reserveCapacity, setReserveCapacity] = useState(initialData?.reservplatser?.toString() || '10')

    const [showRegistrationSlips, setShowRegistrationSlips] = useState(!!initialData?.registration_slip_url)
    const [registrationSlipFile, setRegistrationSlipFile] = useState<File | null>(null)
    const [existingRegistrationSlipUrl, setExistingRegistrationSlipUrl] = useState<string | null>(initialData?.registration_slip_url || null)

    const [showRecurring, setShowRecurring] = useState(!!initialData?.rrule)
    const [showCollaboration, setShowCollaboration] = useState(!!(initialData?.collaborators && initialData.collaborators.length > 0))

    const [showDeadline, setShowDeadline] = useState(!!initialData?.anmalningsfrist)
    const [registrationDeadline, setRegistrationDeadline] = useState(initialData?.anmalningsfrist ? new Date(initialData.anmalningsfrist).toISOString().slice(0, 16) : '')

    // Restrictions State
    const [showAgeLimit, setShowAgeLimit] = useState(!!(initialData?.min_age || initialData?.max_age))
    const [ageMin, setAgeMin] = useState(initialData?.min_age?.toString() || '')
    const [ageMax, setAgeMax] = useState(initialData?.max_age?.toString() || '')

    const [showGenderRestriction, setShowGenderRestriction] = useState(!!(initialData?.genders && initialData.genders.length > 0))
    const [selectedGenders, setSelectedGenders] = useState<string[]>(initialData?.genders || [])

    // New Features State
    const [activityType, setActivityType] = useState<'NORMAL' | 'RANDOM'>(initialData?.activity_type || 'NORMAL')

    // Lottery State
    const [lotteryDate, setLotteryDate] = useState(initialData?.lottery_date ? new Date(initialData.lottery_date).toISOString().slice(0, 16) : '')
    const [confirmationDeadline, setConfirmationDeadline] = useState(initialData?.confirmation_deadline ? new Date(initialData.confirmation_deadline).toISOString().slice(0, 16) : '')

    // Recurrence State
    const [recurrenceFreq, setRecurrenceFreq] = useState('WEEKLY')
    const [recurrenceInterval, setRecurrenceInterval] = useState('1')
    const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

    // Address Search State
    const [orgSearchQuery, setOrgSearchQuery] = useState('')
    const [isOrgPopoverOpen, setIsOrgPopoverOpen] = useState(false)

    // Parse existing rrule if present
    useEffect(() => {
        if (initialData?.rrule) {
            const parts = initialData.rrule.split(';')
            parts.forEach(part => {
                const [key, value] = part.split('=')
                if (key === 'FREQ') setRecurrenceFreq(value)
                if (key === 'INTERVAL') setRecurrenceInterval(value)
                if (key === 'UNTIL') {
                    // Simple handling for now
                }
            })
        }
    }, [initialData])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setRegistrationSlipFile(e.target.files[0])
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement> | null, isDraft = false) {
        if (event) event.preventDefault()
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData()

        // Manual Validation
        const startDateTime = startDate ? new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`) : new Date()
        const endDateTime = endDate ? new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}`) : new Date()
        const now = new Date()

        if (startDateTime < now) {
            setError('Startdatum kan inte vara i det förflutna.')
            setIsSubmitting(false)
            return
        }

        if (endDateTime <= startDateTime) {
            setError('Slutdatum måste vara efter startdatum.')
            setIsSubmitting(false)
            return
        }

        if (capacity && parseInt(capacity) < 0) {
            setError('Antal platser kan inte vara mindre än 0.')
            setIsSubmitting(false)
            return
        }

        // Lottery Validation
        if (activityType === 'RANDOM') {
            if (!registrationDeadline) {
                setError('Sista anmälningsdag krävs för lotteri.')
                setIsSubmitting(false)
                return
            }

            const regDeadline = new Date(registrationDeadline)
            const lottery = new Date(lotteryDate)
            const confirm = new Date(confirmationDeadline)

            if (lottery <= regDeadline) {
                setError('Lottning måste ske efter sista anmälningsdag.')
                setIsSubmitting(false)
                return
            }

            if (confirm <= lottery) {
                setError('Bekräftelsedeadline måste vara efter lottning.')
                setIsSubmitting(false)
                return
            }
        }

        // Append Data
        formData.append('name', name)
        formData.append('description', description)
        formData.append('org_id', selectedOrgId)
        if (startDate) formData.append('date_start', format(startDate, 'yyyy-MM-dd'))
        formData.append('time_start', startTime)
        if (endDate) formData.append('date_end', format(endDate, 'yyyy-MM-dd'))
        formData.append('time_end', endTime)
        formData.append('address', address)
        if (capacity) formData.append('capacity', capacity)
        if (selectedImage) formData.append('image_url', selectedImage)
        if (imageFile) formData.append('image_file', imageFile)

        selectedCategories.forEach(id => formData.append('categories', id))
        selectedTargetGroups.forEach(id => formData.append('target_subgroups', id))
        selectedContacts.forEach(id => formData.append('contact_persons', id))
        selectedGenders.forEach(id => formData.append('genders', id))
        selectedCollaborators.forEach(id => formData.append('collaborators', id))

        formData.append('registration_rules', registrationRule)
        if (registrationRule === 'SELECTED_MEMBERS') {
            invitedMembers.forEach(m => formData.append('invited_members', m.id))
        }

        formData.append('activity_type', activityType)
        if (activityType === 'RANDOM') {
            formData.append('lottery_date', lotteryDate)
            formData.append('confirmation_deadline', confirmationDeadline)
        }

        if (showWaitlist) formData.append('reserve_capacity', reserveCapacity)
        if (showDeadline && registrationDeadline) formData.append('registration_deadline', registrationDeadline)

        if (showAgeLimit) {
            if (ageMin) formData.append('age_min', ageMin)
            if (ageMax) formData.append('age_max', ageMax)
        }

        if (showRecurring) {
            let rruleStr = `FREQ=${recurrenceFreq};INTERVAL=${recurrenceInterval}`
            if (recurrenceEndDate) {
                const until = new Date(recurrenceEndDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
                rruleStr += `;UNTIL=${until}`
            }
            formData.append('rrule', rruleStr)
        }

        if (hideAddress) formData.append('hide_address', 'true')

        if (showRegistrationSlips && registrationSlipFile) {
            formData.append('registration_slip_file', registrationSlipFile)
        } else if (!showRegistrationSlips) {
            // Logic to remove if needed, or just don't send anything implies no change or removal?
            // For now we handle upload. Removal logic might need explicit flag if we want to delete existing.
            // We can add a hidden field if we want to clear it.
            if (initialData?.registration_slip_url && !existingRegistrationSlipUrl) {
                formData.append('remove_registration_slip', 'true')
            }
        }

        if (isDraft) {
            formData.append('status', 'DRAFT')
        }

        try {
            if (initialData?.activity_id) {
                formData.append('activity_id', initialData.activity_id)
                await updateActivity(formData)
                toast.success('Aktiviteten har uppdaterats')
            } else {
                await createActivity(formData)
                toast.success('Aktiviteten har skapats')
            }
            router.push('/staff/aktiviteter')
        } catch (e: any) {
            console.error(e)
            setError(e.message || 'Ett fel uppstod')
            toast.error('Något gick fel')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <form onSubmit={(e) => handleSubmit(e)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Image Upload - Full Width Top */}
                    <Card className="rounded-xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-base font-semibold text-slate-900">Ladda upp bild</Label>
                                <Button type="button" variant="secondary" size="sm" onClick={() => setShowUnsplashModal(true)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100">
                                    Unsplash
                                </Button>
                            </div>

                            {selectedImage ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 group">
                                    <Image
                                        src={selectedImage}
                                        alt="Vald bild"
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button type="button" variant="destructive" size="sm" onClick={() => {
                                            setSelectedImage(null)
                                            setImageFile(null)
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Ta bort
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-video rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-indigo-400 cursor-pointer transition-all bg-slate-50/50"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setImageFile(file)
                                                // Create a preview URL
                                                const url = URL.createObjectURL(file)
                                                setSelectedImage(url)
                                            }
                                        }}
                                    />
                                    <Upload className="w-8 h-8 mb-2 text-indigo-400" />
                                    <span className="font-medium text-slate-700">Klicka för att ladda upp bild</span>
                                    <span className="text-xs mt-1">eller välj från Unsplash via knappen ovan</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-700 font-medium">Aktivitetstitel *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    placeholder="T.ex. Sommarfotboll"
                                    className="text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-medium">Beskrivning</Label>
                                    <div className="min-h-[200px]">
                                        <RichTextEditor
                                            value={description}
                                            onChange={setDescription}
                                            placeholder="Skriv din beskrivning här..."
                                        />
                                    </div>
                                </div>

                                {/* Grid Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Row 1: Dates */}
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">Börjar *</Label>
                                        <div className="flex gap-2">
                                            <DatePicker
                                                date={startDate}
                                                setDate={setStartDate}
                                                fromDate={new Date()}
                                            />
                                            <TimePicker value={startTime} onChange={setStartTime} className="w-[120px]" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">Slutar *</Label>
                                        <div className="flex gap-2">
                                            <DatePicker
                                                date={endDate}
                                                setDate={setEndDate}
                                                fromDate={startDate || new Date()}
                                            />
                                            <TimePicker
                                                value={endTime}
                                                onChange={setEndTime}
                                                className="w-[120px]"
                                                minTime={startDate && endDate && isSameDay(startDate, endDate) ? startTime : undefined}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">Antal platser *</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={capacity}
                                            onChange={e => setCapacity(e.target.value)}
                                            placeholder="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">Kontaktpersoner *</Label>
                                        <MultiSelect
                                            options={staffMembers.map(s => ({ id: s.profile_id, name: s.public_name || s.alias }))}
                                            selected={selectedContacts}
                                            onChange={setSelectedContacts}
                                            placeholder="Välj personal..."
                                        />
                                    </div>

                                    {/* Row 3: Target Group & Categories */}
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">Målgrupp *</Label>
                                        <MultiSelect
                                            options={targetSubgroups.map(t => ({ id: String(t.id), name: t.subgroup_name }))}
                                            selected={selectedTargetGroups}
                                            onChange={setSelectedTargetGroups}
                                            placeholder="Alla åldrar"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-medium">Kategorier *</Label>
                                        <MultiSelect
                                            options={categories.map(c => ({ id: String(c.id), name: c.category_name }))}
                                            selected={selectedCategories}
                                            onChange={setSelectedCategories}
                                            placeholder="Välj kategori..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">

                                    <div className="flex items-center justify-between">
                                        <Label className="text-slate-700 font-medium">Adress *</Label>
                                        <div className="flex items-center space-x-2">
                                            <Switch id="hide-address" checked={hideAddress} onCheckedChange={setHideAddress} />
                                            <Label htmlFor="hide-address" className="text-sm text-slate-600 font-normal cursor-pointer">Dölj adress</Label>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                        <Input
                                            value={address}
                                            onChange={e => setAddress(e.target.value)}
                                            placeholder="Sök adress..."
                                            className="pl-10"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-1">
                                        {allOrganizations
                                            .filter(org => {
                                                const currentOrg = allOrganizations.find(o => o.id === selectedOrgId)
                                                return currentOrg && org.city_id === currentOrg.city_id
                                            })
                                            .slice(0, 4)
                                            .map(org => (
                                                <Button
                                                    key={org.id}
                                                    variant="outline"
                                                    size="sm"
                                                    className="whitespace-nowrap shrink-0"
                                                    onClick={() => setAddress(org.address)}
                                                    type="button"
                                                >
                                                    {org.org_namn}
                                                </Button>
                                            ))}

                                        <Popover open={isOrgPopoverOpen} onOpenChange={setIsOrgPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="whitespace-nowrap shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    type="button"
                                                >
                                                    <Map className="w-4 h-4 mr-2" />
                                                    Fler verksamheter
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <div className="p-2 border-b">
                                                    <Input
                                                        placeholder="Sök verksamhet..."
                                                        value={orgSearchQuery}
                                                        onChange={(e) => setOrgSearchQuery(e.target.value)}
                                                        className="h-8"
                                                    />
                                                </div>
                                                <div className="max-h-[200px] overflow-y-auto p-1">
                                                    {allOrganizations
                                                        .filter(org => {
                                                            const currentOrg = allOrganizations.find(o => o.id === selectedOrgId)
                                                            return currentOrg && org.city_id === currentOrg.city_id
                                                        })
                                                        .filter(org => org.org_namn.toLowerCase().includes(orgSearchQuery.toLowerCase()))
                                                        .map(org => (
                                                            <div
                                                                key={org.id}
                                                                className="flex items-center px-2 py-2 text-sm rounded-sm hover:bg-slate-100 cursor-pointer"
                                                                onClick={() => {
                                                                    setAddress(org.address)
                                                                    setIsOrgPopoverOpen(false)
                                                                }}
                                                            >
                                                                {org.org_namn}
                                                            </div>
                                                        ))
                                                    }
                                                    {allOrganizations
                                                        .filter(org => {
                                                            const currentOrg = allOrganizations.find(o => o.id === selectedOrgId)
                                                            return currentOrg && org.city_id === currentOrg.city_id
                                                        })
                                                        .filter(org => org.org_namn.toLowerCase().includes(orgSearchQuery.toLowerCase())).length === 0 && (
                                                            <div className="p-2 text-sm text-slate-500 text-center">Ingen verksamhet hittades</div>
                                                        )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">

                    {/* Type Card */}
                    <Card className="rounded-xl">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Dices className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-slate-900">Typ</h2>
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setActivityType('NORMAL')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activityType === 'NORMAL' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                >
                                    Normal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActivityType('RANDOM')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activityType === 'RANDOM' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                                >
                                    Lotteri
                                </button>
                            </div>

                            {activityType === 'RANDOM' && (
                                <div className="space-y-4 pt-4 mt-2 border-t border-slate-100 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label>Lottningsdatum</Label>
                                        <Input
                                            type="datetime-local"
                                            value={lotteryDate}
                                            onChange={e => setLotteryDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Svarsdeadline</Label>
                                        <Input
                                            type="datetime-local"
                                            value={confirmationDeadline}
                                            onChange={e => setConfirmationDeadline(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Power Ups Card */}
                    <Card className="bg-white border-slate-200 rounded-xl shadow-sm">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-600" />
                                <CardTitle className="text-lg font-semibold text-slate-900">Power Ups</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Anmälningsregler</Label>
                                <Select value={registrationRule} onValueChange={setRegistrationRule}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Öppen för alla" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN_FOR_ALL">Öppen för alla</SelectItem>
                                        <SelectItem value="ONLY_MEMBERS">Endast medlemmar</SelectItem>
                                        <SelectItem value="SELECTED_MEMBERS">Utvalda medlemmar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {registrationRule === 'SELECTED_MEMBERS' && (
                                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200 animate-in slide-in-from-top-2">
                                    <Label className="text-xs font-medium text-slate-700">Bjud in medlemmar</Label>
                                    <MemberSearch
                                        orgId={selectedOrgId}
                                        onSelect={(member) => {
                                            if (member && !invitedMembers.find(m => m.id === member.profileId)) {
                                                setInvitedMembers([...invitedMembers, { id: member.profileId, alias: member.alias }])
                                            }
                                        }}
                                    />

                                    {invitedMembers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {invitedMembers.map(member => (
                                                <div key={member.id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs border border-indigo-100">
                                                    <span>{member.alias}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setInvitedMembers(invitedMembers.filter(m => m.id !== member.id))}
                                                        className="hover:text-indigo-900"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reservplatser */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="waitlist" className="cursor-pointer flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    Reservplatser
                                </Label>
                                <Switch id="waitlist" checked={showWaitlist} onCheckedChange={setShowWaitlist} />
                            </div>
                            {showWaitlist && (
                                <Input
                                    type="number"
                                    value={reserveCapacity}
                                    onChange={e => setReserveCapacity(e.target.value)}
                                    placeholder="Antal"
                                    className="bg-white"
                                />
                            )}

                            {/* Anmälningslappar */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="slips" className="cursor-pointer flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    Anmälningslappar
                                </Label>
                                <Switch id="slips" checked={showRegistrationSlips} onCheckedChange={setShowRegistrationSlips} />
                            </div>
                            {showRegistrationSlips && (
                                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200">
                                    {existingRegistrationSlipUrl ? (
                                        <div className="flex items-center justify-between text-sm">
                                            <a href={existingRegistrationSlipUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[150px]">
                                                Visa fil
                                            </a>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setExistingRegistrationSlipUrl(null)} className="h-6 w-6 p-0 text-red-500">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="text-xs" />
                                    )}
                                    <p className="text-[10px] text-slate-500">Ladda upp PDF eller Word-fil som medlemmar kan ladda ner.</p>
                                </div>
                            )}

                            {/* Återkommande */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="recurring" className="cursor-pointer flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    Återkommande
                                </Label>
                                <Switch id="recurring" checked={showRecurring} onCheckedChange={setShowRecurring} />
                            </div>
                            {showRecurring && (
                                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200">
                                    <Select value={recurrenceFreq} onValueChange={setRecurrenceFreq}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="WEEKLY">Veckovis</SelectItem>
                                            <SelectItem value="MONTHLY">Månadsvis</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={e => setRecurrenceEndDate(e.target.value)}
                                        className="h-8 text-xs"
                                        placeholder="Slutdatum"
                                    />
                                </div>
                            )}

                            {/* Samarbete */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="collab" className="cursor-pointer flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    Samarbete
                                </Label>
                                <Switch id="collab" checked={showCollaboration} onCheckedChange={setShowCollaboration} />
                            </div>
                            {showCollaboration && (
                                <div className="space-y-2 bg-white p-3 rounded-md border border-slate-200">
                                    <Label className="text-xs font-medium text-slate-700">Välj organisationer</Label>
                                    <MultiSelect
                                        options={allOrganizations
                                            .filter(o => o.id !== selectedOrgId)
                                            .map(o => ({ id: o.id, name: o.org_namn }))}
                                        selected={selectedCollaborators}
                                        onChange={setSelectedCollaborators}
                                        placeholder="Välj samarbetspartners..."
                                    />
                                </div>
                            )}

                            {/* Sista anmälningsdatum */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="deadline" className="cursor-pointer flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    Sista anmälningsdatum
                                </Label>
                                <Switch id="deadline" checked={showDeadline} onCheckedChange={setShowDeadline} />
                            </div>
                            {showDeadline && (
                                <Input
                                    type="datetime-local"
                                    value={registrationDeadline}
                                    onChange={e => setRegistrationDeadline(e.target.value)}
                                    className="bg-white"
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Restriktioner Card */}
                    <Card className="rounded-xl shadow-sm border-slate-200">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                            <CardTitle className="text-base font-medium text-slate-900">Restriktioner</CardTitle>
                            <p className="text-xs text-slate-500">Välj vilka som kan delta</p>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">
                            {/* Åldersgräns */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="age" className="cursor-pointer">Åldersgräns</Label>
                                <Switch id="age" checked={showAgeLimit} onCheckedChange={setShowAgeLimit} />
                            </div>
                            {showAgeLimit && (
                                <div className="grid grid-cols-2 gap-2">
                                    <Input type="number" placeholder="Min" value={ageMin} onChange={e => setAgeMin(e.target.value)} />
                                    <Input type="number" placeholder="Max" value={ageMax} onChange={e => setAgeMax(e.target.value)} />
                                </div>
                            )}

                            {/* Kön */}
                            <div className="flex items-center justify-between">
                                <Label htmlFor="gender" className="cursor-pointer">Kön</Label>
                                <Switch id="gender" checked={showGenderRestriction} onCheckedChange={setShowGenderRestriction} />
                            </div>
                            {showGenderRestriction && (
                                <MultiSelect
                                    options={genders.map(g => ({ id: g.id, name: g.gender }))}
                                    selected={selectedGenders}
                                    onChange={setSelectedGenders}
                                    placeholder="Välj kön"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Actions */}
                <div className="lg:col-span-3 flex justify-between items-center pt-6 border-t border-slate-200 mt-8">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Tillbaka
                    </Button>
                    <div className="flex gap-4">
                        <Button type="button" variant="secondary" onClick={() => setShowPreview(true)} className="rounded-full">
                            <Eye className="w-4 h-4 mr-2" />
                            Förhandsgranska
                        </Button>
                        <Button type="button" variant="outline" onClick={(e) => handleSubmit(null, true)} disabled={isSubmitting} className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                            Spara som utkast
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 shadow-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Publicerar...
                                </>
                            ) : (
                                'Publicera aktivitet'
                            )}
                        </Button>
                    </div>
                </div>

                <UnsplashModal
                    isOpen={showUnsplashModal}
                    onClose={() => setShowUnsplashModal(false)}
                    onSelect={setSelectedImage}
                    orgId={selectedOrgId}
                />

                <ActivityPreviewModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    data={{
                        name,
                        description,
                        imageUrl: selectedImage,
                        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
                        startTime,
                        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
                        endTime,
                        address,
                        capacity: capacity ? parseInt(capacity) : null,
                        orgName: organizations.find(o => o.id === selectedOrgId)?.org_namn || 'Organisation',
                        activityType
                    }}
                />
            </form >

            {error && (
                <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 shadow-lg border border-red-200 animate-in slide-in-from-bottom-5">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-2 h-6 w-6 p-0">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )
            }
        </>
    )
}

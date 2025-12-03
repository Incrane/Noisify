'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, Save, Calendar, Clock } from 'lucide-react'
import { createBooking, updateBooking, deleteBooking } from '@/app/staff/rum/actions'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface Room {
    room_id: string
    rum_namn: string
}

interface Booking {
    id: string
    title: string
    start: Date
    end: Date
    resourceId: string
    status: string
    description?: string
    room_name?: string
}

import MemberSearch, { Member } from './member-search'

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    booking?: Booking | null
    initialDate?: Date
    initialRoomId?: string
    rooms: Room[]
    orgId: string // Add orgId prop
}

export default function BookingModal({
    isOpen,
    onClose,
    booking,
    initialDate,
    initialRoomId,
    rooms,
    orgId
}: BookingModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [roomId, setRoomId] = useState('')

    // Split Date/Time State
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [startTime, setStartTime] = useState('')
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [endTime, setEndTime] = useState('')

    const [status, setStatus] = useState('approved')

    // Member selection state
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)

    useEffect(() => {
        if (isOpen) {
            if (booking) {
                // Edit Mode
                setTitle(booking.title)
                setDescription(booking.description || '')
                setRoomId(booking.resourceId)

                setStartDate(booking.start)
                setStartTime(format(booking.start, 'HH:mm'))

                setEndDate(booking.end)
                setEndTime(format(booking.end, 'HH:mm'))

                setStatus(booking.status)
                setSelectedMember(null) // Reset member selection on edit for now, or fetch if needed
            } else {
                // Create Mode
                setTitle('')
                setDescription('')
                setRoomId(initialRoomId || (rooms.length > 0 ? rooms[0].room_id : ''))

                const start = initialDate || new Date()
                // Round to nearest hour
                start.setMinutes(0, 0, 0)
                const end = new Date(start)
                end.setHours(end.getHours() + 1)

                setStartDate(start)
                setStartTime(format(start, 'HH:mm'))

                setEndDate(end)
                setEndTime(format(end, 'HH:mm'))

                setStatus('approved')
                setSelectedMember(null)
            }
            setError(null)
        }
    }, [isOpen, booking, initialDate, initialRoomId, rooms])

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        if (!startDate || !startTime || !endDate || !endTime) {
            setError('Vänligen fyll i alla datum och tider')
            setIsSubmitting(false)
            return
        }

        const startDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`)
        const endDateTime = new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}`)

        if (endDateTime <= startDateTime) {
            setError('Sluttid måste vara efter starttid')
            setIsSubmitting(false)
            return
        }

        const formData = new FormData()
        formData.append('title', title)
        formData.append('description', description)
        formData.append('room_id', roomId)
        formData.append('start_time', startDateTime.toISOString())
        formData.append('end_time', endDateTime.toISOString())
        formData.append('status', status)

        if (selectedMember) {
            formData.append('booked_for_id', selectedMember.profileId)
        }

        try {
            if (booking) {
                await updateBooking(booking.id, formData)
            } else {
                await createBooking(formData)
            }
            onClose()
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Ett fel inträffade'
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleDelete() {
        if (!booking || !confirm('Är du säker på att du vill ta bort denna bokning?')) return

        setIsSubmitting(true)
        try {
            await deleteBooking(booking.id)
            onClose()
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Kunde inte ta bort bokning'
            setError(message)
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">
                        {booking ? 'Redigera bokning' : 'Ny bokning'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {!booking && (
                        <div>
                            <Label className="mb-1.5">Boka åt medlem (valfritt)</Label>
                            <MemberSearch
                                orgId={orgId}
                                onSelect={setSelectedMember}
                                selectedMember={selectedMember}
                            />
                        </div>
                    )}

                    <div>
                        <Label htmlFor="title" className="mb-1.5">Titel</Label>
                        <Input
                            id="title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            placeholder="T.ex. Bandrep"
                        />
                    </div>

                    <div>
                        <Label htmlFor="room" className="mb-1.5">Rum</Label>
                        <Select
                            value={roomId}
                            onValueChange={setRoomId}
                            disabled={!!booking}
                        >
                            <SelectTrigger id="room" className="bg-white">
                                <SelectValue placeholder="Välj rum" />
                            </SelectTrigger>
                            <SelectContent>
                                {rooms.map(room => (
                                    <SelectItem key={room.room_id} value={room.room_id}>
                                        {room.rum_namn}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Start</Label>
                            <div className="flex flex-col gap-2">
                                <DatePicker date={startDate} setDate={setStartDate} />
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Slut</Label>
                            <div className="flex flex-col gap-2">
                                <DatePicker date={endDate} setDate={setEndDate} />
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="status" className="mb-1.5">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status" className="bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Väntar</SelectItem>
                                <SelectItem value="approved">Godkänd</SelectItem>
                                <SelectItem value="rejected">Avvisad</SelectItem>
                                <SelectItem value="cancelled">Avbokad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="description" className="mb-1.5">Beskrivning</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Valfri beskrivning..."
                            className="resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        {booking ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                size="sm"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Ta bort
                            </Button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Avbryt
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Sparar...' : 'Spara'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

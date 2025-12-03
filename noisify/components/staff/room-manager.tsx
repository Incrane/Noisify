"use client"

import { useState, useMemo } from "react"
import RoomFilters from "./room-filters"
import dynamic from "next/dynamic"
const RoomCalendar = dynamic(() => import("./room-calendar"), { ssr: false })
import Link from "next/link"
import { Plus, LayoutList, Calendar, Users, ShieldCheck, AlertCircle, Image as ImageIcon } from "lucide-react"
import BookingModal from "./booking-modal"
import Image from "next/image"

interface Room {
    room_id: string
    rum_namn: string
    required_perk_id?: string | null
    image_url?: string | null
    capacity?: number | null
    description?: string | null
    status?: string
    requires_approval?: boolean
}

interface Booking {
    id: string
    title: string
    start: Date
    end: Date
    resourceId: string
    status: string
    room_name?: string
    room_id: string
    description?: string
}

interface RoomManagerProps {
    rooms: Room[]
    bookings: Booking[]
    orgId: string
}

export default function RoomManager({ rooms, bookings, orgId }: RoomManagerProps) {
    const [filterState, setFilterState] = useState<{ roomIds: string[], status: string[] }>({
        roomIds: [],
        status: ["pending", "approved"]
    })

    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

    // Booking Modal State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [initialDate, setInitialDate] = useState<Date | undefined>(undefined)
    const [initialRoomId, setInitialRoomId] = useState<string | undefined>(undefined)

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            // Filter by Room
            if (filterState.roomIds.length > 0 && !filterState.roomIds.includes(booking.room_id)) {
                return false
            }

            // Filter by Status
            if (filterState.status.length > 0 && !filterState.status.includes(booking.status)) {
                return false
            }

            return true
        })
    }, [bookings, filterState])

    const calendarRooms = rooms.map(r => ({ id: r.room_id, title: r.rum_namn }))

    const handleSelectEvent = (event: Booking) => {
        setSelectedBooking(event)
        setInitialDate(undefined)
        setInitialRoomId(undefined)
        setIsBookingModalOpen(true)
    }

    const handleSelectSlot = ({ start, resourceId }: { start: Date, resourceId?: string | number }) => {
        setSelectedBooking(null)
        setInitialDate(start)
        setInitialRoomId(resourceId ? String(resourceId) : undefined)
        setIsBookingModalOpen(true)
    }

    const handleCreateBooking = () => {
        setSelectedBooking(null)
        setInitialDate(new Date())
        setInitialRoomId(undefined)
        setIsBookingModalOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Hantera Rum & Bokningar</h1>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'calendar'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Kalender
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === 'list'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <LayoutList className="w-4 h-4" />
                            Rumlista
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreateBooking}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Ny bokning
                        </button>
                        <Link
                            href="/staff/rum/new"
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nytt rum
                        </Link>
                    </div>
                </div>
            </div>

            <RoomFilters
                rooms={rooms}
                onFilterChange={setFilterState}
            />

            {viewMode === 'calendar' ? (
                <RoomCalendar
                    bookings={filteredBookings}
                    rooms={calendarRooms}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                        <Link
                            key={room.room_id}
                            href={`/staff/rum/${room.room_id}`}
                            className="group block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all flex flex-col h-full"
                        >
                            {/* Image Section */}
                            <div className="relative h-48 w-full bg-slate-100">
                                {room.image_url ? (
                                    <Image
                                        src={room.image_url}
                                        alt={room.rum_namn}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                        <ImageIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-2">
                                    {room.status === 'INACTIVE' && (
                                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full shadow-sm">
                                            Ej bokningsbar
                                        </span>
                                    )}
                                    {room.requires_approval && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" />
                                            Kräver godkännande
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-5 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {room.rum_namn}
                                    </h3>
                                </div>

                                {room.description && (
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
                                        {room.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 mt-auto pt-4 border-t border-slate-50 text-xs font-medium text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-slate-400" />
                                        {room.capacity ? `${room.capacity} pers` : 'Obegränsat'}
                                    </div>
                                    {room.required_perk_id && (
                                        <div className="flex items-center gap-1.5 text-amber-600">
                                            <AlertCircle className="w-4 h-4" />
                                            Kräver behörighet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {isBookingModalOpen && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    booking={selectedBooking}
                    initialDate={initialDate}
                    initialRoomId={initialRoomId}
                    rooms={rooms}
                    orgId={orgId}
                />
            )}
        </div>
    )
}

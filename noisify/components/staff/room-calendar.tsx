"use client"

import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const locales = {
    'sv': sv,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

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

interface RoomCalendarProps {
    bookings: Booking[]
    rooms: { id: string, title: string }[]
    onSelectEvent?: (event: Booking) => void
    onSelectSlot?: (slotInfo: { start: Date; end: Date; resourceId?: string | number }) => void
}

export default function RoomCalendar({ bookings, rooms, onSelectEvent, onSelectSlot }: RoomCalendarProps) {
    const [view, setView] = useState<View>(Views.WEEK)
    const [date, setDate] = useState(new Date())

    const eventStyleGetter = (event: Booking) => {
        let backgroundColor = '#4f46e5' // indigo-600
        if (event.status === 'pending') backgroundColor = '#eab308' // yellow-500
        if (event.status === 'cancelled') backgroundColor = '#ef4444' // red-500
        if (event.status === 'rejected') backgroundColor = '#94a3b8' // slate-400

        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        }
    }

    return (
        <div className="h-[600px] bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <Calendar
                localizer={localizer}
                events={bookings}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                culture="sv"
                messages={{
                    next: "Nästa",
                    previous: "Föregående",
                    today: "Idag",
                    month: "Månad",
                    week: "Vecka",
                    day: "Dag",
                    agenda: "Agenda",
                    date: "Datum",
                    time: "Tid",
                    event: "Bokning",
                    noEventsInRange: "Inga bokningar denna period."
                }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                selectable
                components={{
                    toolbar: (props) => (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center justify-between w-full md:w-auto gap-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => props.onNavigate('PREV')}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                                    </button>
                                    <span className="text-lg font-bold text-slate-900 capitalize whitespace-nowrap">
                                        {props.label}
                                    </span>
                                    <button
                                        onClick={() => props.onNavigate('NEXT')}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => props.onNavigate('TODAY')}
                                    className="md:ml-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    Idag
                                </button>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
                                {['month', 'week', 'day', 'agenda'].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => props.onView(v as View)}
                                        className={`flex-1 md:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${view === v
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                    >
                                        {v === 'month' ? 'Månad' : v === 'week' ? 'Vecka' : v === 'day' ? 'Dag' : 'Lista'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                }}
            />
        </div>
    )
}

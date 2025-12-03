"use client"

import { useState, useEffect } from "react"
import { MultiSelect } from "@/components/ui/multi-select"

interface Room {
    room_id: string
    rum_namn: string
}

interface RoomFiltersProps {
    rooms: Room[]
    onFilterChange: (filters: { roomIds: string[], status: string[] }) => void
}

const STATUS_OPTIONS = [
    { id: "pending", name: "Väntar" },
    { id: "approved", name: "Godkänd" },
    { id: "rejected", name: "Avvisad" },
    { id: "cancelled", name: "Avbokad" },
]

export default function RoomFilters({ rooms, onFilterChange }: RoomFiltersProps) {
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["pending", "approved"])

    const roomOptions = rooms.map(r => ({ id: r.room_id, name: r.rum_namn }))

    useEffect(() => {
        onFilterChange({
            roomIds: selectedRoomIds,
            status: selectedStatuses
        })
    }, [selectedRoomIds, selectedStatuses, onFilterChange])

    return (
        <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6">
            <div className="w-full md:w-64">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Rum</label>
                <MultiSelect
                    options={roomOptions}
                    selected={selectedRoomIds}
                    onChange={setSelectedRoomIds}
                    placeholder="Alla rum"
                    searchPlaceholder="Sök rum..."
                />
            </div>
            <div className="w-full md:w-64">
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Status</label>
                <MultiSelect
                    options={STATUS_OPTIONS}
                    selected={selectedStatuses}
                    onChange={setSelectedStatuses}
                    placeholder="Välj status"
                />
            </div>
        </div>
    )
}

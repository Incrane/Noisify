"use client"

import { useState, useEffect } from "react"
import { MultiSelect } from "@/components/ui/multi-select"
import { Filter, X } from "lucide-react"

interface Room {
    room_id: string
    rum_namn: string
}

interface RoomFiltersProps {
    rooms: Room[]
    onFilterChange: (filters: { roomIds: string[], status: string[] }) => void
}

const STATUS_OPTIONS = [
    { id: "pending", name: "Väntar", color: "bg-amber-100 text-amber-700" },
    { id: "approved", name: "Godkänd", color: "bg-green-100 text-green-700" },
    { id: "rejected", name: "Avvisad", color: "bg-red-100 text-red-700" },
    { id: "cancelled", name: "Avbokad", color: "bg-slate-100 text-slate-600" },
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

    const hasActiveFilters = selectedRoomIds.length > 0 || selectedStatuses.length !== 2

    const clearAllFilters = () => {
        setSelectedRoomIds([])
        setSelectedStatuses(["pending", "approved"])
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            {/* Filter Icon Label */}
            <div className="flex items-center gap-2 text-slate-500">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Filter:</span>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row flex-1 gap-3">
                {/* Room Filter */}
                <div className="sm:w-48">
                    <MultiSelect
                        options={roomOptions}
                        selected={selectedRoomIds}
                        onChange={setSelectedRoomIds}
                        placeholder="Alla rum"
                        searchPlaceholder="Sök rum..."
                    />
                </div>

                {/* Status Filter */}
                <div className="sm:w-48">
                    <MultiSelect
                        options={STATUS_OPTIONS.map(s => ({ id: s.id, name: s.name }))}
                        selected={selectedStatuses}
                        onChange={setSelectedStatuses}
                        placeholder="Välj status"
                    />
                </div>

                {/* Active Status Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {selectedStatuses.map(statusId => {
                        const status = STATUS_OPTIONS.find(s => s.id === statusId)
                        if (!status) return null
                        return (
                            <span
                                key={statusId}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                            >
                                {status.name}
                                <button
                                    onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== statusId))}
                                    className="hover:opacity-70 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )
                    })}
                </div>
            </div>

            {/* Clear All Button */}
            {hasActiveFilters && (
                <button
                    onClick={clearAllFilters}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors whitespace-nowrap"
                >
                    Rensa filter
                </button>
            )}
        </div>
    )
}

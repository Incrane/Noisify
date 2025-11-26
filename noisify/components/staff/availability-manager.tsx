'use client'

import { useState } from 'react'
import { Plus, Trash2, Clock, Calendar } from 'lucide-react'
import { createRoomTimeSlotRule, deleteRoomTimeSlotRule } from '@/app/staff/rum/actions'

interface TimeSlotRule {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    effective_from: string
    effective_to?: string | null
}

const DAYS = [
    { value: 1, label: 'Måndag' },
    { value: 2, label: 'Tisdag' },
    { value: 3, label: 'Onsdag' },
    { value: 4, label: 'Torsdag' },
    { value: 5, label: 'Fredag' },
    { value: 6, label: 'Lördag' },
    { value: 7, label: 'Söndag' },
]

export default function AvailabilityManager({
    roomId,
    initialRules = []
}: {
    roomId: string
    initialRules?: TimeSlotRule[]
}) {
    const [rules, setRules] = useState<TimeSlotRule[]>(initialRules)
    const [isAdding, setIsAdding] = useState(false)
    
    // New rule state
    const [dayOfWeek, setDayOfWeek] = useState(1)
    const [startTime, setStartTime] = useState('08:00')
    const [endTime, setEndTime] = useState('17:00')

    const handleAddRule = async () => {
        try {
            setIsAdding(true)
            const newRule = await createRoomTimeSlotRule(roomId, dayOfWeek, startTime, endTime)
            if (newRule) {
                setRules([...rules, newRule])
                // Reset slightly but keep day for convenience
                setStartTime('08:00')
                setEndTime('17:00')
            }
        } catch (error) {
            console.error('Failed to add rule:', error)
            alert('Kunde inte lägga till tid. Försök igen.')
        } finally {
            setIsAdding(false)
        }
    }

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('Ta bort denna tid?')) return
        try {
            await deleteRoomTimeSlotRule(ruleId, roomId)
            setRules(rules.filter(r => r.id !== ruleId))
        } catch (error) {
            console.error('Failed to delete rule:', error)
            alert('Kunde inte ta bort tid.')
        }
    }

    // Group rules by day for display
    const rulesByDay = DAYS.map(day => ({
        ...day,
        rules: rules.filter(r => r.day_of_week === day.value).sort((a, b) => a.start_time.localeCompare(b.start_time))
    }))

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Öppettider & Tillgänglighet</h3>
                        <p className="text-sm text-slate-500">Bestäm när rummet kan bokas.</p>
                    </div>
                </div>

                {/* Add New Rule Form */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-8">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Lägg till tid</h4>
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Dag</label>
                            <select 
                                value={dayOfWeek} 
                                onChange={e => setDayOfWeek(parseInt(e.target.value))}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[140px]"
                            >
                                {DAYS.map(day => (
                                    <option key={day.value} value={day.value}>{day.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Från</label>
                            <input 
                                type="time" 
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="self-center text-slate-400">-</div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Till</label>
                            <input 
                                type="time" 
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleAddRule}
                            disabled={isAdding}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2 ml-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Lägg till
                        </button>
                    </div>
                </div>

                {/* List Rules */}
                <div className="space-y-2">
                    {rulesByDay.map(day => (
                        <div key={day.value} className={`flex items-start py-3 px-4 rounded-lg ${day.rules.length > 0 ? 'bg-white border border-slate-100' : 'opacity-60'}`}>
                            <div className="w-32 font-medium text-slate-700 flex items-center gap-2 pt-1">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {day.label}
                            </div>
                            <div className="flex-1 space-y-2">
                                {day.rules.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {day.rules.map(rule => (
                                            <div key={rule.id} className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-md border border-green-100 text-sm font-medium group">
                                                <Clock className="w-3.5 h-3.5 opacity-70" />
                                                {rule.start_time.substring(0, 5)} - {rule.end_time.substring(0, 5)}
                                                <button 
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="ml-1 p-0.5 text-green-600 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400 italic">Stängt</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

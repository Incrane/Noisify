"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock } from "lucide-react";
import { Loader2 } from "lucide-react";

interface OpeningHoursEditorProps {
    timeslots: any[];
    setTimeslots: (slots: any[]) => void;
    onSave: () => void;
    isPending: boolean;
    isReadOnly: boolean;
    title?: string;
    subtitle?: string;
    showSaveButton?: boolean;
}

const DAYS = [
    { id: 1, name: "Måndag" },
    { id: 2, name: "Tisdag" },
    { id: 3, name: "Onsdag" },
    { id: 4, name: "Torsdag" },
    { id: 5, name: "Fredag" },
    { id: 6, name: "Lördag" },
    { id: 0, name: "Söndag" },
];

export default function OpeningHoursEditor({
    timeslots,
    setTimeslots,
    onSave,
    isPending,
    isReadOnly,
    title,
    subtitle,
    showSaveButton = true
}: OpeningHoursEditorProps) {

    function addTimeslot(dayId: number) {
        if (isReadOnly) return;
        setTimeslots([
            ...timeslots,
            {
                weekday: dayId,
                week_no: 1, // Default, not really used for display but needed for DB
                start_time: "14:00",
                end_time: "18:00",
                note: "",
            },
        ]);
    }

    function removeTimeslot(index: number) {
        if (isReadOnly) return;
        const newTimeslots = [...timeslots];
        newTimeslots.splice(index, 1);
        setTimeslots(newTimeslots);
    }

    function updateTimeslot(index: number, field: string, value: any) {
        if (isReadOnly) return;
        const newTimeslots = [...timeslots];
        newTimeslots[index] = { ...newTimeslots[index], [field]: value };
        setTimeslots(newTimeslots);
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {(title || showSaveButton) && (
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
                        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                    </div>

                    {showSaveButton && !isReadOnly && (
                        <Button
                            onClick={onSave}
                            disabled={isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm whitespace-nowrap"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Spara ändringar
                        </Button>
                    )}
                </div>
            )}

            <div className="divide-y divide-slate-100">
                {DAYS.map((day) => {
                    const daySlots = timeslots
                        .map((ts, idx) => ({ ...ts, originalIndex: idx }))
                        .filter((ts) => ts.weekday === day.id);

                    const isClosed = daySlots.length === 0;

                    return (
                        <div key={day.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start gap-6">
                                <div className="w-24 pt-2">
                                    <h3 className="font-medium text-slate-900">{day.name}</h3>
                                    {isClosed && (
                                        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            Stängt
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 space-y-3">
                                    {daySlots.map((slot) => (
                                        <div key={slot.originalIndex} className="flex items-center gap-3 group">
                                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                                                <Clock className="h-4 w-4 text-slate-400 ml-2" />
                                                <Input
                                                    type="time"
                                                    value={slot.start_time?.slice(0, 5)}
                                                    onChange={(e) =>
                                                        updateTimeslot(slot.originalIndex, "start_time", e.target.value)
                                                    }
                                                    disabled={isReadOnly}
                                                    className="h-8 w-20 border-0 p-0 focus-visible:ring-0 text-center font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                                />
                                                <span className="text-slate-300">-</span>
                                                <Input
                                                    type="time"
                                                    value={slot.end_time?.slice(0, 5)}
                                                    onChange={(e) =>
                                                        updateTimeslot(slot.originalIndex, "end_time", e.target.value)
                                                    }
                                                    disabled={isReadOnly}
                                                    className="h-8 w-20 border-0 p-0 focus-visible:ring-0 text-center font-medium text-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                                                />
                                            </div>

                                            <Input
                                                placeholder="Beskrivning (t.ex. Drop-in)"
                                                value={slot.note || ""}
                                                onChange={(e) =>
                                                    updateTimeslot(slot.originalIndex, "note", e.target.value)
                                                }
                                                disabled={isReadOnly}
                                                className="h-[42px] flex-1 bg-white border-slate-200 focus:border-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                            />

                                            {!isReadOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeTimeslot(slot.originalIndex)}
                                                    className="h-[42px] w-[42px] text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    {!isReadOnly && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => addTimeslot(day.id)}
                                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium h-9 px-3"
                                        >
                                            <Plus className="h-4 w-4 mr-1.5" />
                                            Lägg till tid
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

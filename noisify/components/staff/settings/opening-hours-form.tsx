"use client";

import { useState } from "react";
import { updateSchedule } from "@/app/staff/installningar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Clock, Calendar, Lock } from "lucide-react";

interface OpeningHoursFormProps {
    schedule: any;
    orgId: string;
    roleId: number;
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

export default function OpeningHoursForm({ schedule, orgId, roleId }: OpeningHoursFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [timeslots, setTimeslots] = useState<any[]>(
        schedule?.org_timeslots || []
    );
    const isReadOnly = roleId < 3;

    function addTimeslot(dayId: number) {
        if (isReadOnly) return;
        setTimeslots([
            ...timeslots,
            {
                weekday: dayId,
                week_no: 1,
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

    async function handleSave() {
        if (isReadOnly) return;
        if (!schedule?.id) {
            toast.error("Inget schema hittades att uppdatera");
            return;
        }

        setIsPending(true);
        try {
            const result = await updateSchedule(schedule.id, timeslots);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Öppettider uppdaterade");
            }
        } catch (error) {
            toast.error("Ett fel uppstod");
        } finally {
            setIsPending(false);
        }
    }

    if (!schedule) {
        return (
            <div className="p-12 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Inget schema konfigurerat</h3>
                <p className="text-slate-500 mb-6">Kontakta en administratör för att sätta upp ert grundschema.</p>
                <Button disabled variant="outline">Skapa schema</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {isReadOnly && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3 text-slate-600">
                    <Lock className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-slate-900">Endast läsläge</h3>
                        <p className="text-sm mt-1">
                            Du har inte behörighet att ändra öppettiderna. Kontakta en administratör om något behöver ändras.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Veckoschema</h2>
                        <p className="text-sm text-slate-500">Hantera era ordinarie öppettider</p>
                    </div>
                    {!isReadOnly && (
                        <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Spara ändringar
                        </Button>
                    )}
                </div>

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
                                        {isClosed && <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Stängt</span>}
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
        </div>
    );
}

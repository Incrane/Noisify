"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import OpeningHoursEditor from "./opening-hours-editor";

interface ExceptionManagerProps {
    selectedWeekDate: Date;
    weekNo: number;
    cycleWeekNo?: number; // Which week in the rolling schedule applies
    weeksCount?: number; // Total weeks in the rolling schedule
    timeslots: any[];
    setTimeslots: (slots: any[]) => void;
    onSave: () => void;
    onReset: () => void; // Reset to standard
    isPending: boolean;
    isReadOnly: boolean;
    hasOverride: boolean;
}

export default function ExceptionManager({
    selectedWeekDate,
    weekNo,
    cycleWeekNo,
    weeksCount,
    timeslots,
    setTimeslots,
    onSave,
    onReset,
    isPending,
    isReadOnly,
    hasOverride
}: ExceptionManagerProps) {

    const formattedDate = format(selectedWeekDate, "d MMMM yyyy", { locale: sv });
    const showCycleInfo = weeksCount && weeksCount > 1 && cycleWeekNo;

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-amber-900">Vecka {weekNo}</h3>
                        <span className="text-amber-700 text-sm">({formattedDate})</span>
                        {showCycleInfo && (
                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                                Motsvarar Vecka {cycleWeekNo} i schemat
                            </span>
                        )}
                    </div>

                    {!hasOverride ? (
                        <p className="text-sm text-amber-800 mt-1">
                            Just nu används <strong>grundschemat</strong> för denna vecka. Gör ändringar nedan och spara för att skapa en avvikelse.
                        </p>
                    ) : (
                        <p className="text-sm text-amber-800 mt-1">
                            Denna vecka har en <strong>anpassad</strong> öppettid (avvikelse).
                        </p>
                    )}
                </div>

                {hasOverride && !isReadOnly && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReset}
                        className="bg-white border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Återställ till standard
                    </Button>
                )}
            </div>

            <OpeningHoursEditor
                timeslots={timeslots}
                setTimeslots={setTimeslots}
                onSave={onSave}
                isPending={isPending}
                isReadOnly={isReadOnly}
                showSaveButton={true}
            />
        </div>
    );
}

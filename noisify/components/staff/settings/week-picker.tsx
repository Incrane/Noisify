"use client";

import { Calendar } from "@/components/ui/calendar";
import { startOfWeek, endOfWeek, isSameWeek, format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface WeekPickerProps {
    selectedDate: Date | null;
    onWeekSelect: (date: Date) => void;
    exceptions?: Date[]; // Dates that have overrides (start_date)
    className?: string; // Add className to props
}

export default function WeekPicker({ selectedDate, onWeekSelect, exceptions = [], className }: WeekPickerProps) {
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    // Custom modifiers to highlight the entire week on hover and selection
    const modifiers = {
        selectedWeek: (date: Date) => selectedDate ? isSameWeek(date, selectedDate, { weekStartsOn: 1 }) : false,
        hoverWeek: (date: Date) => hoverDate ? isSameWeek(date, hoverDate, { weekStartsOn: 1 }) : false,
        hasException: (date: Date) => {
            // Check if this date's week has an exception
            return exceptions.some(exDate => isSameWeek(date, new Date(exDate), { weekStartsOn: 1 }));
        }
    };

    const modifiersStyles = {
        selectedWeek: {
            backgroundColor: "var(--indigo-50)",
            color: "var(--indigo-900)",
            fontWeight: "500"
        },
        hoverWeek: {
            backgroundColor: "var(--slate-50)"
        }
    };

    const modifiersClassNames = {
        selectedWeek: "bg-indigo-50 text-indigo-900 font-medium rounded-none first:rounded-l-md last:rounded-r-md",
        hoverWeek: "bg-slate-50/50 rounded-none first:rounded-l-md last:rounded-r-md",
        hasException: "font-bold text-amber-600 relative after:content-['•'] after:absolute after:top-1 after:right-1 after:text-[8px] after:text-amber-500"
    };

    const handleDayClick = (date: Date) => {
        // Always select the Monday of that week
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        onWeekSelect(weekStart);
    };

    return (
        <div className={cn("p-4 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit", className)}>
            <div className="mb-4">
                <h3 className="font-semibold text-slate-900">Välj vecka</h3>
                <p className="text-sm text-slate-500">
                    {selectedDate
                        ? `Vald: Vecka ${format(selectedDate, "w", { locale: sv })}`
                        : "Klicka på ett datum för att redigera den veckan"}
                </p>
            </div>

            <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onDayClick={handleDayClick}
                onDayMouseEnter={setHoverDate}
                onDayMouseLeave={() => setHoverDate(null)}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                showOutsideDays={true}
                className="pointer-events-auto"
                locale={sv}
            />

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 px-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span>Markerade veckor har avvikelser</span>
            </div>
        </div>
    );
}

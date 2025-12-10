"use client";

import { useState, useMemo, useEffect } from "react";
import { upsertSchedule, deleteSchedule } from "@/app/staff/installningar/actions";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { getISOWeek, startOfWeek, format } from "date-fns";
import OpeningHoursEditor from "./opening-hours-editor";
import WeekPicker from "./week-picker";
import ExceptionManager from "./exception-manager";

interface OpeningHoursFormProps {
    schedules: any[];
    orgId: string;
    roleId: number;
}

export default function OpeningHoursForm({ schedules, orgId, roleId }: OpeningHoursFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [activeTab, setActiveTab] = useState("standard");
    const isReadOnly = roleId < 2;

    // --- STANDARD SCHEDULE LOGIC ---
    const standardSchedule = useMemo(() =>
        schedules.find(s => s.start_date === null),
        [schedules]);

    // Multi-week config state
    const [weeksCount, setWeeksCount] = useState<number>(standardSchedule?.weeks_count || 1);
    const [week1Start, setWeek1Start] = useState<Date | undefined>(
        standardSchedule?.week1_start ? new Date(standardSchedule.week1_start) : undefined
    );
    const [activeWeekTab, setActiveWeekTab] = useState("1");

    // Timeslots grouped by week_no
    const [allTimeslots, setAllTimeslots] = useState<any[]>([]);

    useEffect(() => {
        if (standardSchedule) {
            setAllTimeslots(standardSchedule.org_timeslots || []);
            setWeeksCount(standardSchedule.weeks_count || 1);
            if (standardSchedule.week1_start && standardSchedule.week1_start !== '2000-01-01') {
                setWeek1Start(new Date(standardSchedule.week1_start));
            }
        } else {
            setAllTimeslots([]);
        }
    }, [standardSchedule]);

    // Filter timeslots for the currently selected week tab
    const currentWeekTimeslots = useMemo(() =>
        allTimeslots.filter(ts => ts.week_no === parseInt(activeWeekTab)),
        [allTimeslots, activeWeekTab]
    );

    function setCurrentWeekTimeslots(newSlots: any[]) {
        const weekNo = parseInt(activeWeekTab);
        // Replace slots for current week, keep others
        setAllTimeslots(prev => [
            ...prev.filter(ts => ts.week_no !== weekNo),
            ...newSlots.map(s => ({ ...s, week_no: weekNo }))
        ]);
    }

    async function handleSaveStandard() {
        if (isReadOnly) return;
        setIsPending(true);
        try {
            // Clean and prepare all timeslots
            const cleanedSlots = allTimeslots.map(({ id, created_at, schedule_id, ...slot }) => slot);

            const config = {
                weeks_count: weeksCount,
                week1_start: week1Start ? format(week1Start, "yyyy-MM-dd") : null
            };

            const result = await upsertSchedule(null, cleanedSlots, config);
            if (result.error) toast.error(result.error);
            else toast.success("Grundschemat har uppdaterats");
        } catch (error) {
            toast.error("Ett fel uppstod");
        } finally {
            setIsPending(false);
        }
    }


    // --- EXCEPTION / WEEKLY LOGIC ---
    const [selectedWeekDate, setSelectedWeekDate] = useState<Date | null>(null);
    const [exceptionTimeslots, setExceptionTimeslots] = useState<any[]>([]);

    // Determine the active schedule for the selected week
    const selectedWeekString = useMemo(() =>
        selectedWeekDate ? format(selectedWeekDate, "yyyy-MM-dd") : null,
        [selectedWeekDate]);

    const activeExceptionSchedule = useMemo(() =>
        selectedWeekString ? schedules.find(s => s.start_date === selectedWeekString) : null,
        [schedules, selectedWeekString]);

    const hasOverride = !!activeExceptionSchedule;

    // Calculate which week in the cycle applies for a given date
    function getCycleWeekNo(date: Date): number {
        if (!week1Start || weeksCount <= 1) return 1;

        const anchorStart = startOfWeek(week1Start, { weekStartsOn: 1 }); // Monday
        const targetStart = startOfWeek(date, { weekStartsOn: 1 });

        // Calculate weeks difference
        const diffMs = targetStart.getTime() - anchorStart.getTime();
        const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

        // Cycle through weeks (1-indexed)
        const cycleWeek = ((diffWeeks % weeksCount) + weeksCount) % weeksCount + 1;
        return cycleWeek;
    }

    // Load slots for selected week
    useEffect(() => {
        if (!selectedWeekDate) return;

        if (activeExceptionSchedule) {
            // Load existing override
            setExceptionTimeslots(activeExceptionSchedule.org_timeslots || []);
        } else {
            // Calculate which cycle week applies to the selected date
            const applicableWeekNo = getCycleWeekNo(selectedWeekDate);

            const templateSlots = (standardSchedule?.org_timeslots || [])
                .filter((ts: any) => ts.week_no === applicableWeekNo)
                .map((ts: any) => ({
                    weekday: ts.weekday,
                    start_time: ts.start_time,
                    end_time: ts.end_time,
                    note: ts.note,
                    week_no: 1
                }));
            setExceptionTimeslots(templateSlots);
        }
    }, [activeExceptionSchedule, selectedWeekDate, standardSchedule, week1Start, weeksCount]);


    async function handleSaveException() {
        if (isReadOnly || !selectedWeekDate || !selectedWeekString) return;
        setIsPending(true);
        try {
            const cleanedSlots = exceptionTimeslots.map(({ id, created_at, ...slot }) => ({
                ...slot,
                week_no: 1
            }));

            const result = await upsertSchedule(selectedWeekString, cleanedSlots);
            if (result.error) toast.error(result.error);
            else toast.success(`Avvikelse för vecka ${getISOWeek(selectedWeekDate)} sparad`);
        } catch (error) {
            toast.error("Utförandet misslyckades");
        } finally {
            setIsPending(false);
        }
    }

    async function handleResetException() {
        if (isReadOnly || !selectedWeekDate || !selectedWeekString || !activeExceptionSchedule) return;

        if (!confirm("Är du säker? Detta tar bort avvikelsen och återgår till grundschemat.")) return;

        setIsPending(true);
        try {
            const result = await deleteSchedule(activeExceptionSchedule.id);
            if (result.error) toast.error(result.error);
            else {
                toast.success("Avvikelse borttagen");
                const applicableWeekNo = getCycleWeekNo(selectedWeekDate);
                const templateSlots = (standardSchedule?.org_timeslots || [])
                    .filter((ts: any) => ts.week_no === applicableWeekNo)
                    .map((ts: any) => ({
                        weekday: ts.weekday,
                        start_time: ts.start_time,
                        end_time: ts.end_time,
                        note: ts.note,
                        week_no: 1
                    }));
                setExceptionTimeslots(templateSlots);
            }
        } catch (error) {
            toast.error("Utförandet misslyckades");
        } finally {
            setIsPending(false);
        }
    }

    // List all dates that have overrides for the calendar
    const exceptionDates = useMemo(() =>
        schedules
            .filter(s => s.start_date !== null)
            .map(s => new Date(s.start_date)),
        [schedules]);

    // Generate week tabs for multi-week
    const weekTabs = useMemo(() => {
        const tabs = [];
        for (let i = 1; i <= weeksCount; i++) {
            tabs.push({ value: String(i), label: `Vecka ${i}` });
        }
        return tabs;
    }, [weeksCount]);


    return (
        <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="standard">Grundschema (Standard)</TabsTrigger>
                    <TabsTrigger value="exceptions">Kalender & Avvikelser</TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    {/* Multi-week week selector */}
                    {weeksCount > 1 && (
                        <Tabs value={activeWeekTab} onValueChange={setActiveWeekTab}>
                            <TabsList>
                                {weekTabs.map(tab => (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    )}

                    <OpeningHoursEditor
                        timeslots={currentWeekTimeslots}
                        setTimeslots={setCurrentWeekTimeslots}
                        onSave={handleSaveStandard}
                        isPending={isPending}
                        isReadOnly={isReadOnly}
                        title={weeksCount > 1 ? `Öppettider - Vecka ${activeWeekTab}` : "Ordinarie Öppettider"}
                        subtitle={weeksCount > 1 ? `Redigerar vecka ${activeWeekTab} av ${weeksCount} i schemat.` : "Detta schema repeteras varje vecka."}
                    />

                    {/* Advanced Settings */}
                    <details className="border rounded-lg p-4 bg-slate-50">
                        <summary className="font-medium cursor-pointer text-slate-700">Avancerade inställningar för schema</summary>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="weeks_count">Antal veckor *</Label>
                                <Select
                                    value={String(weeksCount)}
                                    onValueChange={(v) => setWeeksCount(parseInt(v))}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger id="weeks_count">
                                        <SelectValue placeholder="Välj antal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 veckorschema</SelectItem>
                                        <SelectItem value="2">2 veckorschema</SelectItem>
                                        <SelectItem value="3">3 veckorschema</SelectItem>
                                        <SelectItem value="4">4 veckorschema</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500">Välj hur många veckor schemat sträcker sig över.</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Vecka 1 börjar *</Label>
                                <DatePicker
                                    date={week1Start}
                                    setDate={setWeek1Start}
                                    disabled={isReadOnly}
                                />
                                <p className="text-xs text-slate-500">Ange datum för första veckan i schemat.</p>
                            </div>
                        </div>
                    </details>
                </TabsContent>

                <TabsContent value="exceptions" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* LEFT: Calendar */}
                        <div className="w-full lg:w-auto flex-shrink-0">
                            <WeekPicker
                                selectedDate={selectedWeekDate}
                                onWeekSelect={setSelectedWeekDate}
                                exceptions={exceptionDates}
                            />
                        </div>

                        {/* RIGHT: Editor */}
                        <div className="flex-1 w-full">
                            {selectedWeekDate ? (
                                <ExceptionManager
                                    selectedWeekDate={selectedWeekDate}
                                    weekNo={getISOWeek(selectedWeekDate)}
                                    cycleWeekNo={getCycleWeekNo(selectedWeekDate)}
                                    weeksCount={weeksCount}
                                    timeslots={exceptionTimeslots}
                                    setTimeslots={setExceptionTimeslots}
                                    onSave={handleSaveException}
                                    onReset={handleResetException}
                                    isPending={isPending}
                                    isReadOnly={isReadOnly}
                                    hasOverride={hasOverride}
                                />
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8 text-center">
                                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900">Välj en vecka i kalendern</h3>
                                    <p className="max-w-sm mt-2">
                                        Klicka på ett datum till vänster för att se eller redigera öppettiderna för den specifika veckan.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";

export default function ActivitySettingsClient() {
    const [mounted, setMounted] = useState(false);
    const [view, setView] = useState("list");

    useEffect(() => {
        setMounted(true);
        // Load view setting from local storage
        const savedView = localStorage.getItem("noisify-activity-view");
        if (savedView) {
            setView(savedView);
        }
    }, []);

    const handleViewChange = (value: string) => {
        setView(value);
        localStorage.setItem("noisify-activity-view", value);
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
                <h3 className="font-semibold text-slate-900 mb-4">Standardvy</h3>
                <RadioGroup value={view} onValueChange={handleViewChange}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="list" id="view-list" />
                        <Label htmlFor="view-list">Lista</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="grid" id="view-grid" />
                        <Label htmlFor="view-grid">Rutnät</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="calendar" id="view-calendar" />
                        <Label htmlFor="view-calendar">Kalender</Label>
                    </div>
                </RadioGroup>
            </div>
        </div>
    );
}

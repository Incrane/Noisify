"use client";

import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEffect, useState } from "react";

export default function DisplaySettingsClient() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load accessibility settings from local storage
        const savedHighContrast = localStorage.getItem("noisify-high-contrast") === "true";
        const savedReducedMotion = localStorage.getItem("noisify-reduced-motion") === "true";
        setHighContrast(savedHighContrast);
        setReducedMotion(savedReducedMotion);
    }, []);

    const handleHighContrastChange = (checked: boolean) => {
        setHighContrast(checked);
        localStorage.setItem("noisify-high-contrast", String(checked));
        // Apply class to body or html if needed, for now just state
        if (checked) {
            document.documentElement.classList.add("high-contrast");
        } else {
            document.documentElement.classList.remove("high-contrast");
        }
    };

    const handleReducedMotionChange = (checked: boolean) => {
        setReducedMotion(checked);
        localStorage.setItem("noisify-reduced-motion", String(checked));
        if (checked) {
            document.documentElement.classList.add("reduced-motion");
        } else {
            document.documentElement.classList.remove("reduced-motion");
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
                <h3 className="font-semibold text-slate-900 mb-4">Tema</h3>
                <RadioGroup value={theme} onValueChange={setTheme}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light">Ljust</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark">Mörkt</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="theme-system" />
                        <Label htmlFor="theme-system">Auto (följ systemet)</Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="border-t border-slate-100 pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Tillgänglighet</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="high-contrast" className="flex-1 cursor-pointer">
                            Hög kontrast
                        </Label>
                        <Switch
                            id="high-contrast"
                            checked={highContrast}
                            onCheckedChange={handleHighContrastChange}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="reduced-motion" className="flex-1 cursor-pointer">
                            Reducera rörelser
                        </Label>
                        <Switch
                            id="reduced-motion"
                            checked={reducedMotion}
                            onCheckedChange={handleReducedMotionChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

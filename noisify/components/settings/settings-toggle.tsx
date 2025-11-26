"use client";

import { Switch } from "@/components/ui/switch";

interface SettingsToggleProps {
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function SettingsToggle({
    title,
    description,
    checked,
    onCheckedChange,
    disabled = false,
}: SettingsToggleProps) {
    return (
        <div className="flex items-start justify-between gap-4 py-3">
            <div className="flex-1">
                <p className="font-medium text-slate-900 text-sm">{title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{description}</p>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
            />
        </div>
    );
}

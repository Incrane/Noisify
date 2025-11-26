import { LucideIcon } from "lucide-react";

interface SettingsSectionProps {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
}

export function SettingsSection({
    title,
    icon: Icon,
    children,
}: SettingsSectionProps) {
    return (
        <div className="bg-slate-50 rounded-xl p-6 space-y-2">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
            </div>
            <div className="space-y-1 divide-y divide-slate-200">
                {children}
            </div>
        </div>
    );
}

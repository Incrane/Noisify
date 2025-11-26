"use client";

import Link from "next/link";
import {
    Bell,
    User,
    Shield,
    Palette,
    Lock,
    LogOut,
    Trash2,
    ChevronRight,
    Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAccessItemProps {
    icon: React.ElementType;
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "danger";
    showArrow?: boolean;
}

function QuickAccessItem({
    icon: Icon,
    label,
    href,
    onClick,
    variant = "default",
    showArrow = true
}: QuickAccessItemProps) {
    const content = (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-xl transition-all duration-200",
            "hover:bg-slate-50 active:scale-[0.99]",
            variant === "danger" ? "text-red-600 hover:bg-red-50" : "text-slate-700"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    variant === "danger" ? "bg-red-100 text-red-600" : "bg-indigo-50 text-indigo-600"
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{label}</span>
            </div>
            {showArrow && <ChevronRight className="w-5 h-5 text-slate-300" />}
        </div>
    );

    if (href) {
        return <Link href={href} className="block">{content}</Link>;
    }

    return <button onClick={onClick} className="w-full text-left">{content}</button>;
}

export function QuickAccessMenu({ onLogout }: { onLogout: () => void }) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
                    Inställningar
                </h3>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                    <QuickAccessItem
                        icon={Bell}
                        label="Notiser"
                        href="/app/profil/installningar/notiser"
                    />
                    <QuickAccessItem
                        icon={User}
                        label="Konto"
                        href="/app/profil/installningar/konto"
                    />
                    <QuickAccessItem
                        icon={Calendar}
                        label="Aktiviteter"
                        href="/app/profil/installningar/aktiviteter"
                    />
                    <QuickAccessItem
                        icon={Shield}
                        label="Integritet"
                        href="/app/profil/installningar/integritet"
                    />
                    <QuickAccessItem
                        icon={Palette}
                        label="Utseende"
                        href="/app/profil/installningar/utseende"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
                    Kontoåtgärder
                </h3>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                    <QuickAccessItem
                        icon={Lock}
                        label="Ändra lösenord"
                        href="/app/profil/andra-losenord"
                    />
                    <QuickAccessItem
                        icon={LogOut}
                        label="Logga ut"
                        onClick={onLogout}
                        showArrow={false}
                    />
                    <QuickAccessItem
                        icon={Trash2}
                        label="Radera konto"
                        href="/app/profil/radera-konto"
                        variant="danger"
                    />
                </div>
            </div>
        </div>
    );
}

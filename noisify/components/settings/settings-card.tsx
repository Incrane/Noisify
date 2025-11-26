"use client";

import Link from "next/link";
import * as Icons from "lucide-react";

interface SettingsCardProps {
    title: string;
    iconName: keyof typeof Icons;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "danger";
}

export function SettingsCard({
    title,
    iconName,
    href,
    onClick,
    variant = "default",
}: SettingsCardProps) {
    // Dynamically get the icon component
    const Icon = Icons[iconName] as Icons.LucideIcon;

    const baseClasses = `flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md group ${variant === "default" ? "bg-white border-slate-200 hover:border-slate-300" : "bg-white border-red-200 hover:border-red-300"
        }`;

    const iconClasses = `w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${variant === "default" ? "text-slate-700" : "text-red-600"
        }`;

    const textClasses = `font-medium ${variant === "default" ? "text-slate-900" : "text-red-600"
        }`;

    const arrowClasses = `w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 ${variant === "default" ? "text-slate-400" : "text-red-400"
        }`;

    const content = (
        <>
            <div className="flex items-center gap-3">
                <Icon className={iconClasses} />
                <span className={textClasses}>{title}</span>
            </div>
            <svg
                className={arrowClasses}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                />
            </svg>
        </>
    );

    if (href) {
        return (
            <Link href={href} className={baseClasses}>
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button onClick={onClick} className={baseClasses}>
                {content}
            </button>
        );
    }

    return (
        <div className={baseClasses}>
            {content}
        </div>
    );
}

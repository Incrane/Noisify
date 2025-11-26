"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Calendar, Users, Star, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";

export interface MembershipCardProps {
    membership: any;
    isActive: boolean;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function MembershipCard({ membership, isActive, style, onClick }: MembershipCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "from-emerald-500 to-emerald-600";
            case "pending":
                return "from-amber-400 to-amber-500";
            case "awaiting_visit":
                return "from-blue-400 to-blue-500";
            case "expired":
                return "from-slate-500 to-slate-600";
            case "rejected":
                return "from-red-500 to-red-600";
            case "cancelled":
                return "from-zinc-500 to-zinc-600";
            case "suspended":
                return "from-orange-500 to-orange-600";
            default:
                return "from-slate-500 to-slate-600";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle2 className="w-5 h-5 text-white/90" />;
            case "pending":
            case "awaiting_visit":
                return <Clock className="w-5 h-5 text-white/90" />;
            case "expired":
            case "cancelled":
            case "rejected":
                return <XCircle className="w-5 h-5 text-white/90" />;
            case "suspended":
                return <AlertCircle className="w-5 h-5 text-white/90" />;
            default:
                return <AlertCircle className="w-5 h-5 text-white/90" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "active":
                return "Aktiv";
            case "pending":
                return "Väntar svar";
            case "awaiting_visit":
                return "Väntar på besök";
            case "expired":
                return "Utgånget";
            case "rejected":
                return "Avvisad";
            case "cancelled":
                return "Avslutad";
            case "suspended":
                return "Avstängd";
            default:
                return "Okänd";
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Datum saknas";
        try {
            return format(new Date(dateString), "d MMM yyyy", { locale: sv });
        } catch (e) {
            return "Datum saknas";
        }
    };

    return (
        <div
            className={cn(
                "absolute w-full h-full rounded-2xl p-6 text-white shadow-xl transition-all duration-300 cursor-pointer overflow-hidden",
                "bg-gradient-to-br",
                getStatusColor(membership.membership_state),
                isActive ? "shadow-2xl" : "shadow-lg"
            )}
            style={style}
            onClick={onClick}
        >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-24 -translate-x-24 blur-2xl" />

            <div className="relative h-full flex flex-col justify-between z-10">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border border-white/30">
                            {membership.organization_logo ? (
                                <img
                                    src={membership.organization_logo}
                                    alt={membership.organization_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xl font-bold">
                                    {membership.organization_name.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">
                                {membership.organization_name}
                            </h3>
                            <p className="text-white/80 text-sm">
                                {membership.city || "Göteborg"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        {getStatusIcon(membership.membership_state)}
                        <span>{getStatusText(membership.membership_state)}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-white/90">
                        <span>Medlem sedan</span>
                        <span className="font-medium">
                            {formatDate(membership.member_since)}
                        </span>
                    </div>

                    <div className="h-px bg-white/20" />

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <Calendar className="w-5 h-5 mx-auto mb-1 text-white/90" />
                            <div className="text-lg font-bold">{membership.total_registrations || 0}</div>
                            <div className="text-[10px] uppercase tracking-wider text-white/70">Aktiviteter</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <Star className="w-5 h-5 mx-auto mb-1 text-white/90" />
                            <div className="text-lg font-bold">{membership.active_perks || 0}</div>
                            <div className="text-[10px] uppercase tracking-wider text-white/70">Förmåner</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                            <Users className="w-5 h-5 mx-auto mb-1 text-white/90" />
                            <div className="text-lg font-bold">{membership.total_active_members || 0}</div>
                            <div className="text-[10px] uppercase tracking-wider text-white/70">Medlemmar</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

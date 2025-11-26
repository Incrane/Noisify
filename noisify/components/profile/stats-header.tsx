"use client";

import { Settings, MapPin } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface StatsHeaderProps {
    profile: any;
}

export function StatsHeader({ profile }: StatsHeaderProps) {
    return (
        <div className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-16 translate-x-8" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar className="w-20 h-20 border-4 border-white shadow-md">
                    <AvatarImage src={profile.image_url} alt={profile.alias} />
                    <AvatarFallback className="text-xl font-bold bg-indigo-100 text-indigo-600">
                        {profile.alias?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{profile.alias}</h1>
                            <div className="flex items-center text-slate-500 text-sm mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {profile.city || "Göteborg"}
                            </div>
                        </div>
                        <Link href="/app/profil/installningar/konto">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
                        <div className="text-center sm:text-left">
                            <div className="text-lg font-bold text-slate-900">
                                {profile.total_accepted_activities || 0}
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Aktiviteter</div>
                        </div>
                        <div className="text-center sm:text-left">
                            <div className="text-lg font-bold text-slate-900">
                                {profile.total_completed_courses || 0}
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Kurser</div>
                        </div>
                        <div className="text-center sm:text-left">
                            <div className="text-lg font-bold text-slate-900">
                                {profile.total_active_perks || 0}
                            </div>
                            <div className="text-xs text-slate-500 uppercase tracking-wide">Förmågor</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

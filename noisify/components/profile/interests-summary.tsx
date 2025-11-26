"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InterestsSummaryProps {
    interests: any[];
}

export function InterestsSummary({ interests }: InterestsSummaryProps) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                    Mina Intressen <span className="text-slate-400 font-normal">({interests.length})</span>
                </h2>
                <Link href="/app/profil/intressen">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                        <Plus className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <div className="flex flex-wrap gap-2">
                {interests.length > 0 ? (
                    interests.map((interest) => (
                        <Badge
                            key={interest.id}
                            variant="secondary"
                            className="px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            style={{
                                backgroundColor: interest.bg_color || undefined,
                                color: interest.color || undefined,
                            }}
                        >
                            {interest.cat_name}
                        </Badge>
                    ))
                ) : (
                    <p className="text-slate-500 text-sm">
                        Du har inte valt några intressen än. Lägg till intressen för att få personliga rekommendationer!
                    </p>
                )}
            </div>
        </div>
    );
}

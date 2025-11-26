import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ActivitiesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: activities } = await supabase
        .from("v_my_schedule")
        .select("*")
        .eq("user_id", user.id)
        .order("starts_at", { ascending: true });

    const upcoming = activities?.filter((a: any) => a.time_label === 'upcoming' || a.time_label === 'today') || [];
    const past = activities?.filter((a: any) => a.time_label === 'past') || [];
    const pending = activities?.filter((a: any) => a.registration_status === 'PENDING') || [];

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/app/profil">
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </div>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Mina Aktiviteter</h1>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="upcoming">Kommande ({upcoming.length})</TabsTrigger>
                    <TabsTrigger value="pending">Väntande ({pending.length})</TabsTrigger>
                    <TabsTrigger value="past">Tidigare ({past.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="space-y-4">
                    {upcoming.length > 0 ? (
                        upcoming.map((activity: any) => (
                            <ActivityCard key={activity.registration_id} activity={activity} />
                        ))
                    ) : (
                        <EmptyState message="Inga kommande aktiviteter" />
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    {pending.length > 0 ? (
                        pending.map((activity: any) => (
                            <ActivityCard key={activity.registration_id} activity={activity} />
                        ))
                    ) : (
                        <EmptyState message="Inga väntande anmälningar" />
                    )}
                </TabsContent>

                <TabsContent value="past" className="space-y-4">
                    {past.length > 0 ? (
                        past.map((activity: any) => (
                            <ActivityCard key={activity.registration_id} activity={activity} isPast />
                        ))
                    ) : (
                        <EmptyState message="Inga tidigare aktiviteter" />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ActivityCard({ activity, isPast }: { activity: any; isPast?: boolean }) {
    return (
        <div className={`bg-white p-4 rounded-xl border ${isPast ? 'border-slate-100 opacity-75' : 'border-slate-200 shadow-sm'} flex gap-4`}>
            <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                {activity.image_url ? (
                    <img src={activity.image_url} alt={activity.activity_name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                        {activity.activity_name.charAt(0)}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-900 truncate">{activity.activity_name}</h3>
                    <StatusBadge status={activity.registration_status} />
                </div>
                <p className="text-sm text-slate-500 truncate">{activity.organization_name}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{activity.activity_date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{activity.start_time} - {activity.end_time}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        ACCEPTED: "bg-green-100 text-green-700",
        PENDING: "bg-amber-100 text-amber-700",
        WAITLISTED: "bg-orange-100 text-orange-700",
        REJECTED: "bg-red-100 text-red-700",
        INVITED: "bg-blue-100 text-blue-700",
    };

    const labels: Record<string, string> = {
        ACCEPTED: "Godkänd",
        PENDING: "Väntar",
        WAITLISTED: "Kölista",
        REJECTED: "Nekad",
        INVITED: "Inbjuden",
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${styles[status] || "bg-slate-100 text-slate-600"}`}>
            {labels[status] || status}
        </span>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">{message}</p>
        </div>
    );
}

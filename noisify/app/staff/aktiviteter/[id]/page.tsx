import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import StaffRegistrationManager from "../../../../components/staff/staff-registration-manager";
import RegistrationStatusButton from "@/components/staff/registration-status-button";
import RemoveParticipantButton from "@/components/staff/remove-participant-button";

interface RegistrationWithProfile {
    registration_id: string;
    status: string;
    created_at: string;
    profiles: {
        id: string;
        alias: string | null;
        user_id: string;
    } | null;
}

export default async function StaffActivityDetailPage({
    params,
}: {
    params: { id: string };
}) {

    const supabase = await createClient();
    const { id } = await params;

    // Fetch Activity
    const { data: activity } = await supabase
        .from("activity_dashboard")
        .select("*")
        .eq("activity_id", id)
        .single();

    if (!activity) return <div>Aktiviteten hittades inte.</div>;

    // Check Permissions
    const { data: hasPermission } = await supabase.rpc('is_activity_org_staff', {
        p_activity_id: id,
        p_user_id: (await supabase.auth.getUser()).data.user?.id
    });

    if (!hasPermission) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Åtkomst nekad</h1>
                <p className="text-slate-600 mb-6 max-w-md">
                    Du har inte behörighet att hantera denna aktivitet. Kontrollera att du är inloggad med rätt konto och har rättigheter i organisationen.
                </p>
                <Link href="/staff/aktiviteter" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                    Tillbaka till översikten
                </Link>
            </div>
        );
    }

    // Fetch Registrations via Secure RPC
    const { data: registrationsData, error: regError } = await supabase
        .rpc("get_activity_registrations_json", {
            p_activity_id: id,
            p_user_id: (await supabase.auth.getUser()).data.user?.id
        });

    if (regError) {
        console.error("Error fetching registrations:", regError);
    }

    const regList = (registrationsData as unknown as RegistrationWithProfile[]) || [];
    const pending = regList.filter(r => r.status === 'PENDING');
    const accepted = regList.filter(r => r.status === 'ACCEPTED');
    const waitlisted = regList.filter(r => r.status === 'WAITLISTED');
    const invited = regList.filter(r => r.status === 'INVITED');
    const rejected = regList.filter(r => r.status === 'REJECTED');

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <Link href="/staff/aktiviteter" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Tillbaka
                </Link>
                <div className="flex gap-2">
                    {/* Edit Button */}
                    <Link href={`/staff/aktiviteter/${id}/redigera`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Redigera
                    </Link>
                </div>
            </div>

            {/* Activity Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">{activity.aktivitet}</h1>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {new Date(activity.start_datum_tid).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {activity.start_tid} - {activity.slut_tid}
                            </span>
                            {activity.plats && (
                                <span className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> {activity.plats}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">{activity.antal_godkanda} <span className="text-slate-400 text-lg font-normal">/ {activity.total_kapacitet || '∞'}</span></div>
                        <div className="text-sm text-slate-500">Deltagare</div>
                    </div>
                </div>
            </div>

            {/* Pending Registrations */}
            {pending.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-100 flex justify-between items-center">
                        <h2 className="font-bold text-yellow-800 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5" /> Väntande godkännande ({pending.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {pending.map((reg) => (
                            <div key={reg.registration_id} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900">{reg.profiles?.alias || 'Okänd'}</div>
                                    <div className="text-xs text-slate-500">Reg: {new Date(reg.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="flex gap-2">
                                    <RegistrationStatusButton
                                        registrationId={reg.registration_id}
                                        activityId={id}
                                        status="ACCEPTED"
                                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" /> Godkänn
                                    </RegistrationStatusButton>
                                    <RegistrationStatusButton
                                        registrationId={reg.registration_id}
                                        activityId={id}
                                        status="REJECTED"
                                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors flex items-center gap-1"
                                    >
                                        <XCircle className="w-3 h-3" /> Neka
                                    </RegistrationStatusButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Waitlisted Registrations */}
            {waitlisted.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                        <h2 className="font-bold text-orange-800 flex items-center gap-2">
                            <Clock className="w-5 h-5" /> Väntelista ({waitlisted.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {waitlisted.map((reg, index) => (
                            <div key={reg.registration_id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900">{reg.profiles?.alias || 'Okänd'}</div>
                                        <div className="text-xs text-slate-500">Reg: {new Date(reg.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <RegistrationStatusButton
                                        registrationId={reg.registration_id}
                                        activityId={id}
                                        status="ACCEPTED"
                                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" /> Ta in
                                    </RegistrationStatusButton>
                                    <RegistrationStatusButton
                                        registrationId={reg.registration_id}
                                        activityId={id}
                                        status="REJECTED"
                                        className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                    >
                                        <XCircle className="w-3 h-3" /> Ta bort
                                    </RegistrationStatusButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invited Registrations */}
            {invited.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                        <h2 className="font-bold text-blue-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5" /> Inbjudna ({invited.length})
                        </h2>
                        <span className="text-xs text-blue-600">Väntar på svar...</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {invited.map((reg) => (
                            <div key={reg.registration_id} className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-900">{reg.profiles?.alias || 'Okänd'}</div>

                                </div>
                                <RegistrationStatusButton
                                    registrationId={reg.registration_id}
                                    activityId={id}
                                    status="REJECTED"
                                    className="text-xs text-slate-400 hover:text-red-600 hover:underline"
                                >
                                    Ångra inbjudan
                                </RegistrationStatusButton>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Accepted Registrations */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-900">Deltagare ({accepted.length})</h2>
                    <StaffRegistrationManager activityId={id} />
                </div>
                <div className="divide-y divide-slate-100">
                    {accepted.map((reg) => (
                        <div key={reg.registration_id} className="p-4 flex items-center justify-between group hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                                    {reg.profiles?.alias?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-900">{reg.profiles?.alias}</div>

                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <RemoveParticipantButton
                                    registrationId={reg.registration_id}
                                    activityId={id}
                                    participantName={reg.profiles?.alias || 'Okänd'}
                                    className="text-xs text-red-600 hover:underline flex items-center gap-1"
                                />
                            </div>
                        </div>
                    ))}
                    {accepted.length === 0 && (
                        <div className="p-8 text-center text-slate-500 italic">Inga deltagare än.</div>
                    )}
                </div>
            </div>

            {/* Rejected/Removed (Collapsible or at bottom) */}
            {rejected.length > 0 && (
                <div className="opacity-50 hover:opacity-100 transition-opacity">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Nekade / Borttagna ({rejected.length})</h3>
                    <div className="bg-slate-50 rounded-lg border border-slate-100 divide-y divide-slate-100">
                        {rejected.map((reg) => (
                            <div key={reg.registration_id} className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="text-sm font-medium">{reg.profiles?.alias}</div>
                                </div>
                                <RegistrationStatusButton
                                    registrationId={reg.registration_id}
                                    activityId={id}
                                    status="PENDING"
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Återställ till väntande
                                </RegistrationStatusButton>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

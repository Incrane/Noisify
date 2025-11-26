import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotificationSettingsClient from "./notification-settings-client";

export default async function NotificationSettingsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("profile")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        redirect("/app/profil");
    }

    const { data: settings } = await supabase
        .from("user_settings")
        .select("notification_settings")
        .eq("profile_id", profile.id)
        .single();

    // Default notification settings structure
    const defaultSettings = {
        push: {
            enabled: false,
            new_invites: false,
            activity_reminders: false,
            chat_messages: false,
            news_updates: false,
        },
        email: {
            enabled: true,
            new_invites: true,
            activity_reminders: true,
            chat_messages: false,
            news_updates: true,
            activity_calendar: false,
            membership_updates: true,
            room_booking_updates: true,
            course_updates: true,
            new_activities_matching_interests: true,
            organization_announcements: true,
        },
        reminder_timing: {
            activity_reminder_hours_before: 24,
            booking_reminder_hours_before: 2,
        },
    };

    const notificationSettings = settings?.notification_settings || defaultSettings;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/app/profil"
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <p className="text-sm text-slate-500">Tillbaka</p>
                    <h1 className="text-2xl font-bold text-slate-900">Notiser</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Hantera hur du får aviseringar från Noisify.
                    </p>
                </div>
            </div>

            <NotificationSettingsClient initialSettings={notificationSettings} />
        </div>
    );
}

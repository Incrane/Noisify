"use client";

import { useState, useTransition } from "react";
import { Bell, Mail, Bell as Reminder } from "lucide-react";
import { SettingsSection } from "@/components/settings/settings-section";
import { SettingsToggle } from "@/components/settings/settings-toggle";
import { updateNotificationSettings } from "../../actions";
import { useRouter } from "next/navigation";

interface NotificationSettings {
    push: {
        enabled: boolean;
        new_invites: boolean;
        activity_reminders: boolean;
        chat_messages: boolean;
        news_updates: boolean;
    };
    email: {
        enabled: boolean;
        new_invites: boolean;
        activity_reminders: boolean;
        chat_messages: boolean;
        news_updates: boolean;
        activity_calendar: boolean;
        membership_updates: boolean;
        room_booking_updates: boolean;
        course_updates: boolean;
        new_activities_matching_interests: boolean;
        organization_announcements: boolean;
    };
    reminder_timing: {
        activity_reminder_hours_before: number;
        booking_reminder_hours_before: number;
    };
}

export default function NotificationSettingsClient({
    initialSettings,
}: {
    initialSettings: NotificationSettings;
}) {
    const [settings, setSettings] = useState(initialSettings);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleUpdate = (newSettings: NotificationSettings) => {
        setSettings(newSettings);
        startTransition(async () => {
            try {
                await updateNotificationSettings(newSettings);
                router.refresh();
            } catch (error) {
                console.error("Failed to update settings:", error);
            }
        });
    };

    const updatePushSetting = (key: keyof typeof settings.push, value: boolean) => {
        const newSettings = {
            ...settings,
            push: { ...settings.push, [key]: value },
        };
        handleUpdate(newSettings);
    };

    const updateEmailSetting = (key: keyof typeof settings.email, value: boolean) => {
        const newSettings = {
            ...settings,
            email: { ...settings.email, [key]: value },
        };
        handleUpdate(newSettings);
    };

    return (
        <div className="space-y-6">
            {/* Push Notifications */}
            <SettingsSection title="Push-notiser" icon={Bell}>
                <SettingsToggle
                    title="Nya inbjudningar"
                    description="När du blir inbjuden till en ny aktivitet eller grupp."
                    checked={settings.push.new_invites}
                    onCheckedChange={(checked) => updatePushSetting("new_invites", checked)}
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Aktivitetspåminnelser"
                    description="Påminnelser för kommande aktiviteter du deltar i."
                    checked={settings.push.activity_reminders}
                    onCheckedChange={(checked) =>
                        updatePushSetting("activity_reminders", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Chattmeddelanden"
                    description="Nya meddelanden från din kontakter och grupper."
                    checked={settings.push.chat_messages}
                    onCheckedChange={(checked) => updatePushSetting("chat_messages", checked)}
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Nyheter & uppdateringar"
                    description="Information om nya funktioner och community-nyheter."
                    checked={settings.push.news_updates}
                    onCheckedChange={(checked) => updatePushSetting("news_updates", checked)}
                    disabled={isPending}
                />
            </SettingsSection>

            {/* Email Notifications */}
            <SettingsSection title="E-postnotiser" icon={Mail}>
                <SettingsToggle
                    title="Nya inbjudningar"
                    description="När du blir inbjuden till en ny aktivitet eller grupp."
                    checked={settings.email.new_invites}
                    onCheckedChange={(checked) => updateEmailSetting("new_invites", checked)}
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Aktivitetspåminnelser"
                    description="Påminnelser för kommande aktiviteter du deltar i."
                    checked={settings.email.activity_reminders}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("activity_reminders", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Chattmeddelanden"
                    description="Nya meddelanden från din kontakter och grupper."
                    checked={settings.email.chat_messages}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("chat_messages", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Nyheter & uppdateringar"
                    description="Information om nya funktioner och community-nyheter."
                    checked={settings.email.news_updates}
                    onCheckedChange={(checked) => updateEmailSetting("news_updates", checked)}
                    disabled={isPending}
                />
            </SettingsSection>

            {/* Email Notifications 2 */}
            <SettingsSection title="E-postnotiser 2" icon={Mail}>
                <SettingsToggle
                    title="Aktivitetskalendern"
                    description="Du får e-post när du blir inbjuden till en ny aktivitet eller grupp."
                    checked={settings.email.activity_calendar}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("activity_calendar", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Aktivitetspåminnelser"
                    description="Påminnelser för kommande aktiviteter du deltar i."
                    checked={settings.email.activity_reminders}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("activity_reminders", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Inbjudningar"
                    description="E-postinviteringar om aktiviteter du har anmält dig till."
                    checked={settings.email.new_invites}
                    onCheckedChange={(checked) => updateEmailSetting("new_invites", checked)}
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Medlemskapsstatus"
                    description="Underrättelse om när ditt medlemskap går ut eller behöver förnyas."
                    checked={settings.email.membership_updates}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("membership_updates", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Rumsbokningar"
                    description="Bekräftelser och uppdateringar kring dina lokala rum."
                    checked={settings.email.room_booking_updates}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("room_booking_updates", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Kursuppdateringar"
                    description="Information om ändringar och nyheter kring kurser som beröri dig."
                    checked={settings.email.course_updates}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("course_updates", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Nya aktiviteter för dig"
                    description="När det nya aktiviteter matcher dina intressen."
                    checked={settings.email.new_activities_matching_interests}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("new_activities_matching_interests", checked)
                    }
                    disabled={isPending}
                />
                <SettingsToggle
                    title="Organisationsnytt"
                    description="Nyheter och uppdateringar från organisationen och community:n."
                    checked={settings.email.organization_announcements}
                    onCheckedChange={(checked) =>
                        updateEmailSetting("organization_announcements", checked)
                    }
                    disabled={isPending}
                />
            </SettingsSection>

            {/* Reminders */}
            <SettingsSection title="Påminnelser" icon={Reminder}>
                <div className="py-3 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                            Aktiviteter
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Få påminnelser om kommande aktiviteter du deltar i.
                        </p>
                        <select
                            value={settings.reminder_timing.activity_reminder_hours_before}
                            onChange={(e) => {
                                const newSettings = {
                                    ...settings,
                                    reminder_timing: {
                                        ...settings.reminder_timing,
                                        activity_reminder_hours_before: Number(e.target.value),
                                    },
                                };
                                handleUpdate(newSettings);
                            }}
                            disabled={isPending}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="1">1 timme före</option>
                            <option value="2">2 timmar före</option>
                            <option value="24">24 timmar före</option>
                            <option value="48">48 timmar före</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                            Bokningar
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Påminnelser om dina bokningar eller annat du har barndt dig till.
                        </p>
                        <select
                            value={settings.reminder_timing.booking_reminder_hours_before}
                            onChange={(e) => {
                                const newSettings = {
                                    ...settings,
                                    reminder_timing: {
                                        ...settings.reminder_timing,
                                        booking_reminder_hours_before: Number(e.target.value),
                                    },
                                };
                                handleUpdate(newSettings);
                            }}
                            disabled={isPending}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="1">1 timme före</option>
                            <option value="2">2 timmar före</option>
                            <option value="24">24 timmar före</option>
                            <option value="48">48 timmar före</option>
                        </select>
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
}

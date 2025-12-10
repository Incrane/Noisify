import { createClient } from "@/utils/supabase/server";
import { getSelectedOrganization } from "../actions";
import { getCities, getMembershipStats } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrgInfoForm from "@/components/staff/settings/org-info-form";
import OpeningHoursForm from "@/components/staff/settings/opening-hours-form";
import MembershipSettingsForm from "@/components/staff/settings/membership-settings-form";
import PlanView from "@/components/staff/settings/plan-view";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) {
        redirect("/staff");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Fetch Organization Info
    const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

    // Fetch Schedule & Timeslots
    const { data: schedules } = await supabase
        .from("org_schedules")
        .select("*, org_timeslots(*)")
        .eq("org_id", orgId)
        .order("start_date", { ascending: true, nullsFirst: true });

    // schedules now contains both the standard schedule (start_date is null) and weekly overrides

    // Fetch Membership Types
    const { data: membershipTypes } = await supabase
        .from("org_membership_types")
        .select("*")
        .eq("org_id", orgId)
        .order("start_date", { ascending: false });

    // Fetch Current User Role
    const { data: orgUser } = await supabase
        .from("org_user")
        .select("role_id")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .single();

    // Fallback if user_id is not directly on org_user
    let roleId = orgUser?.role_id || 0;
    if (!orgUser) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
        if (profile) {
            const { data: orgUserByProfile } = await supabase
                .from("org_user")
                .select("role_id")
                .eq("org_id", orgId)
                .eq("profile_id", profile.id)
                .single();
            roleId = orgUserByProfile?.role_id || 0;
        }
    }

    // Fetch cities
    const cities = await getCities();

    // Fetch membership stats
    const { data: membershipStats } = await getMembershipStats();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Inställningar</h1>
                <p className="text-muted-foreground">
                    Hantera information och inställningar för din verksamhet. Dessa uppgifter visas publikt i systemet.
                </p>
            </div>

            {org?.org_status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900">
                    <h3 className="font-semibold mb-1">Begränsad åtkomst</h3>
                    <p className="text-sm">
                        Eftersom din organisation väntar på godkännande kan du endast redigera grundläggande information.
                        Öppettider, abonnemang och medlemskap blir tillgängliga när organisationen är godkänd.
                    </p>
                </div>
            )}

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Verksamhetens info</TabsTrigger>
                    <TabsTrigger value="hours" disabled={org?.org_status === 'pending'}>Öppettider</TabsTrigger>
                    {roleId >= 3 && (
                        <TabsTrigger value="plan" disabled={org?.org_status === 'pending'}>Plan</TabsTrigger>
                    )}
                    <TabsTrigger value="membership" disabled={org?.org_status === 'pending'}>Medlemskap</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <OrgInfoForm
                        organization={org}
                        roleId={roleId}
                        cities={cities || []}
                    />
                </TabsContent>

                <TabsContent value="hours" className="space-y-4">
                    <OpeningHoursForm schedules={schedules || []} orgId={orgId} roleId={roleId} />
                </TabsContent>

                {roleId >= 3 && (
                    <TabsContent value="plan" className="space-y-4">
                        <PlanView />
                    </TabsContent>
                )}

                <TabsContent value="membership" className="space-y-4">
                    <MembershipSettingsForm
                        membershipTypes={membershipTypes || []}
                        membershipStats={membershipStats || {}}
                        roleId={roleId}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

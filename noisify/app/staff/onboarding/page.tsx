import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getSelectedOrganization } from "@/app/staff/actions";
import OnboardingWizard from "./onboarding-wizard";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const orgId = await getSelectedOrganization();

    if (!orgId) {
        redirect("/staff"); // Should not happen if redirected from create modal, but safety check
    }

    const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

    if (!org) redirect("/staff");

    return <OnboardingWizard initialData={org} />;
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAdminStats() {
    const supabase = await createClient();

    // Parallelize queries for performance
    const [
        { count: totalOrgs },
        { count: pendingOrgs },
        { count: upgradeRequests },
        { count: totalUsers }
    ] = await Promise.all([
        supabase.from("organizations").select("*", { count: "exact", head: true }),
        supabase.from("organizations").select("*", { count: "exact", head: true }).eq("org_status", "pending"),
        supabase.from("organizations").select("*", { count: "exact", head: true }).not("upgrade_requested_tier", "is", null),
        supabase.from("profiles").select("*", { count: "exact", head: true })
    ]);

    return {
        totalOrgs: totalOrgs || 0,
        pendingOrgs: pendingOrgs || 0,
        upgradeRequests: upgradeRequests || 0,
        totalUsers: totalUsers || 0
    };
}

export async function approveOrganization(orgId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from("organizations")
        .update({ org_status: "active" })
        .eq("id", orgId);

    if (error) throw new Error("Failed to approve organization");

    revalidatePath("/super_admin");
    revalidatePath("/super_admin/organizations");
}

export async function rejectOrganization(orgId: string) {
    const supabase = await createClient();

    // For now, we set status to 'inactive' as 'rejected' is not in the enum
    const { error } = await supabase
        .from("organizations")
        .update({ org_status: "inactive" })
        .eq("id", orgId);

    if (error) throw new Error("Failed to reject organization");

    revalidatePath("/super_admin");
    revalidatePath("/super_admin/organizations");
}

export async function processUpgrade(orgId: string, newTier: string, startDate: Date, endDate: Date | null) {
    const supabase = await createClient();

    // 1. Create subscription record
    const { error: subError } = await supabase
        .from("org_subscriptions")
        .insert({
            org_id: orgId,
            tier: newTier,
            start_date: startDate.toISOString(),
            end_date: endDate ? endDate.toISOString() : null,
            is_active: true
        });

    if (subError) throw new Error("Failed to create subscription: " + subError.message);

    // 2. Update organization tier and clear request
    const { error: orgError } = await supabase
        .from("organizations")
        .update({
            upgrade_requested_tier: null,
            tier: newTier
        })
        .eq("id", orgId);

    if (orgError) throw new Error("Failed to update organization: " + orgError.message);

    revalidatePath("/super_admin");
    revalidatePath("/super_admin/upgrades");
}

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getSelectedOrganization } from "../actions";

export async function updateOrganizationInfo(formData: FormData) {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) {
        return { error: "Ingen organisation vald" };
    }

    const city_id = formData.get("city_id");
    const org_status = formData.get("org_status");
    const tier = formData.get("tier");
    const social_links_json = formData.get("social_links");
    const cover_position = formData.get("cover_position");

    console.log("city_id:", city_id);
    console.log("org_status:", org_status);
    console.log("tier:", tier);
    console.log("social_links_json:", social_links_json);
    console.log("cover_position:", cover_position);

    const updateData: { [key: string]: any } = {
        org_namn: formData.get("name"),
        org_description: formData.get("description"),
        adress: formData.get("address"),
        city_id: city_id,
        org_status: org_status,
        tier: tier,
        contact_email: formData.get("contact_email"),
        contact_phone: formData.get("contact_phone"),
        logo_url: formData.get("logo_url"),
        cover_url: formData.get("cover_url"),
        cover_position: cover_position ? parseInt(cover_position as string) : 50,
        social_links: social_links_json ? JSON.parse(social_links_json as string) : {},
    };

    console.log("updateData:", updateData);

    const { error } = await supabase
        .from("organizations")
        .update(updateData)
        .eq("id", orgId);

    if (error) {
        console.error("Error updating organization:", error);
        return { error: "Kunde inte uppdatera organisationen: " + error.message };
    }

    revalidatePath("/staff/installningar");
    return { success: true };
}

export async function uploadOrganizationLogo(formData: FormData) {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) return { error: "Ingen organisation vald" };

    const file = formData.get("file") as File;
    if (!file) return { error: "Ingen fil vald" };

    // Validate file type
    if (!file.type.startsWith("image/")) {
        return { error: "Endast bilder är tillåtna (JPG, PNG, WEBP)" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return { error: "Filen är för stor. Maxstorlek är 5MB." };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${orgId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("public_images")
        .upload(filePath, file);

    if (uploadError) {
        return { error: "Kunde inte ladda upp bild: " + uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("public_images")
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}

export async function updateSchedule(scheduleId: string, timeslots: any[]) {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) return { error: "Ingen organisation vald" };

    // Verify schedule belongs to org
    const { data: schedule } = await supabase
        .from("org_schedules")
        .select("id")
        .eq("id", scheduleId)
        .eq("org_id", orgId)
        .single();

    if (!schedule) return { error: "Schema hittades inte" };

    // Delete existing timeslots for this schedule
    const { error: deleteError } = await supabase
        .from("org_timeslots")
        .delete()
        .eq("schedule_id", scheduleId);

    if (deleteError) return { error: deleteError.message };

    // Insert new timeslots
    if (timeslots.length > 0) {
        const { error: insertError } = await supabase
            .from("org_timeslots")
            .insert(timeslots.map(ts => ({ ...ts, schedule_id: scheduleId })));

        if (insertError) return { error: insertError.message };
    }

    revalidatePath("/staff/installningar");
    return { success: true };
}

export async function getPublicTargetSubgroups() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("target_subgroups")
        .select("*")
        .order("sort");

    if (error) return { error: error.message };
    return { data };
}

export async function createMembershipType(data: any) {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) return { error: "Ingen organisation vald" };

    const { error } = await supabase
        .from("org_membership_types")
        .insert({
            org_id: orgId,
            type: data.name, // Using name as type for backward compatibility or just mapping it
            name: data.name,
            description: data.description,
            price: data.price,
            start_date: data.start_date,
            end_date: data.end_date,
            min_age: data.min_age,
            max_age: data.max_age,
            target_subgroups: data.target_subgroups, // Now expects array of UUID strings
            approval_flow: data.approval_flow,
            requires_verified_profile: data.requires_verified_profile,
            card_design: data.card_design
        });

    if (error) return { error: error.message };

    revalidatePath("/staff/installningar");
    return { success: true };
}

export async function deleteMembershipType(id: string) {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) return { error: "Ingen organisation vald" };

    const { error, count } = await supabase
        .from("org_membership_types")
        .delete({ count: "exact" })
        .eq("id", id)
        .eq("org_id", orgId);

    if (error) return { error: error.message };
    if (count === 0) return { error: "Kunde inte ta bort perioden (hittades inte eller behörighet saknas)" };

    revalidatePath("/staff/installningar");
    return { success: true };
}

export async function updateMembershipType(id: string, data: any) {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) return { error: "Ingen organisation vald" };

    // 1. Update the membership type
    const { error: updateError } = await supabase
        .from("org_membership_types")
        .update({
            name: data.name,
            description: data.description,
            price: data.price,
            start_date: data.start_date,
            end_date: data.end_date,
            min_age: data.min_age,
            max_age: data.max_age,
            target_subgroups: data.target_subgroups,
            approval_flow: data.approval_flow,
            requires_verified_profile: data.requires_verified_profile,
            card_design: data.card_design
        })
        .eq("id", id)
        .eq("org_id", orgId);

    if (updateError) return { error: updateError.message };

    // 2. Find all active members with this membership type
    const { data: members, error: membersError } = await supabase
        .from("memberships")
        .select("profile_id")
        .eq("membership_type_id", id)
        .eq("membership_state", "active"); // Only notify active members? Or all? Let's say active for now.

    if (membersError) {
        console.error("Error fetching members for notification:", membersError);
        // We don't stop the update if fetching members fails, but we log it.
    } else if (members && members.length > 0) {
        // 3. Create notifications
        const notifications = members.map(member => ({
            org_id: orgId,
            assigned_user_id: member.profile_id,
            type: "membership_update",
            title: "Ditt medlemskap har uppdaterats",
            message: `Medlemskapet "${data.name}" har uppdaterats. Vänligen granska ändringarna.`,
            link_url: "/app/profil", // Direct them to their profile where they can see memberships
            related_membership_id: id // Although schema says related_membership_id, it might link to the specific membership record, but here we link to the type or maybe we assume the user can find it. Wait, related_membership_id usually links to the 'memberships' table, not 'org_membership_types'. But we don't have the specific membership ID for each user in this map easily without fetching it.
            // Actually, 'memberships' table has 'id'. The select above only fetched 'profile_id'.
            // Let's fetch 'id' as well if we want to link to specific membership.
        }));

        // Refetch with ID to be precise if needed, or just insert without specific related_membership_id if it's a general update.
        // However, looking at the schema, `related_membership_id` is likely a foreign key to `memberships`.
        // Let's just link to the organization or leave related_membership_id null if it's about the TYPE.
        // But the user request says "review it".
        // Let's try to be helpful.

        // Let's fetch id as well.
    }

    // Re-doing the fetch to include ID for better notification linking if possible
    if (!membersError) {
        const { data: membersWithIds } = await supabase
            .from("memberships")
            .select("id, profile_id")
            .eq("membership_type_id", id)
            .in("membership_state", ["active", "pending"]); // Notify pending too? Maybe.

        if (membersWithIds && membersWithIds.length > 0) {
            const notifications = membersWithIds.map(member => ({
                org_id: orgId,
                assigned_user_id: member.profile_id,
                type: "membership_update",
                title: "Uppdatering av medlemskap",
                message: `Villkoren eller informationen för ditt medlemskap "${data.name}" har uppdaterats av organisationen.`,
                link_url: "/app/profil",
                related_membership_id: member.id
            }));

            const { error: notifyError } = await supabase
                .from("notifications")
                .insert(notifications);

            if (notifyError) {
                console.error("Error sending notifications:", notifyError);
            }
        }
    }

    revalidatePath("/staff/installningar");
    return { success: true };
}

export async function uploadOrganizationCover(formData: FormData) {
    const supabase = await createClient();
    const orgId = await getSelectedOrganization();

    if (!orgId) return { error: "Ingen organisation vald" };

    const file = formData.get("file") as File;
    if (!file) return { error: "Ingen fil vald" };

    // Validate file type
    if (!file.type.startsWith("image/")) {
        return { error: "Endast bilder är tillåtna (JPG, PNG, WEBP)" };
    }

    // Validate file size (max 10MB for covers)
    if (file.size > 10 * 1024 * 1024) {
        return { error: "Filen är för stor. Maxstorlek är 10MB." };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `cover_${orgId}_${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("public_images")
        .upload(filePath, file);

    if (uploadError) {
        return { error: "Kunde inte ladda upp omslagsbild: " + uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("public_images")
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}

export async function getCities() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("cities")
        .select("id, name:city")
        .order("city");

    if (error) {
        console.error("Error fetching cities:", JSON.stringify(error, null, 2));
        return [];
    }

    return data;
}

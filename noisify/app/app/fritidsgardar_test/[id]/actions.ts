"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getMembershipTypes(orgId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from("org_membership_types")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString());
    return data || [];
}

export async function applyForMembership(orgId: string, membershipTypeId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Du måste vara inloggad för att ansöka." };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        return { error: "Profil saknas." };
    }

    // Check if already member
    const { data: existing } = await supabase
        .from("memberships")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("org_id", orgId)
        .single();

    if (existing) {
        return { error: "Du är redan medlem eller har en ansökan." };
    }

    // Get membership type details
    const { data: type } = await supabase
        .from("org_membership_types")
        .select("*")
        .eq("id", membershipTypeId)
        .single();

    if (!type) return { error: "Medlemskapstyp hittades inte." };

    // Validate Eligibility
    const currentYear = new Date().getFullYear();
    const age = currentYear - profile.fodd_ar;

    if (type.min_age && age < type.min_age) return { error: `Du måste vara minst ${type.min_age} år.` };
    if (type.max_age && age > type.max_age) return { error: `Du får vara max ${type.max_age} år.` };

    if (type.requires_verified_profile && !profile.is_verified) {
        return { error: "Detta medlemskap kräver en verifierad profil." };
    }

    // Validate Target Subgroups
    if (type.target_subgroups && type.target_subgroups.length > 0) {
        if (!profile.target_subgroup) {
            return { error: "Du måste tillhöra en målgrupp för att söka detta medlemskap." };
        }
        // Check if user's subgroup is in the allowed list
        // type.target_subgroups is an array of strings (UUIDs)
        // profile.target_subgroup is a UUID string
        if (!type.target_subgroups.includes(profile.target_subgroup)) {
            return { error: "Du tillhör inte rätt målgrupp för detta medlemskap." };
        }
    }

    let status = 'pending';
    if (type.approval_flow === 'AUTO') status = 'active';
    if (type.approval_flow === 'IN_PERSON') status = 'awaiting_visit';

    const { error } = await supabase
        .from("memberships")
        .insert({
            profile_id: profile.id,
            org_id: orgId,
            membership_type_id: membershipTypeId,
            membership_state: status,
            start_date: new Date().toISOString(),
        });

    if (error) {
        console.error("Membership error:", error);
        return { error: "Kunde inte skapa medlemskap." };
    }

    revalidatePath(`/app/fritidsgardar/${orgId}`);
    revalidatePath("/app/profil");
    return { success: true };
}

export async function bookRoom(
    roomId: string,
    orgId: string,
    startsAt: string,
    endsAt: string,
    title: string,
    description: string
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Du måste vara inloggad för att boka." };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        return { error: "Profil saknas." };
    }

    // Calculate duration in minutes
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    if (durationMinutes <= 0) {
        return { error: "Sluttid måste vara efter starttid." };
    }

    const { error } = await supabase
        .from("room_bookings")
        .insert({
            room_id: roomId,
            profile_id: profile.id,
            org_id: orgId,
            starts_at: startsAt,
            ends_at: endsAt,
            duration_minutes: durationMinutes,
            title: title,
            description: description,
            status: "pending", // Default to pending
            participant_count: 1, // Default
        });

    if (error) {
        console.error("Booking error:", error);
        return { error: "Kunde inte boka rummet." };
    }

    revalidatePath(`/app/fritidsgardar/${orgId}`);
    return { success: true };
}

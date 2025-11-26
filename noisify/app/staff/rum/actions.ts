'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function checkOrgStatus(orgId: string, supabase: any) {
    const { data: org } = await supabase
        .from('organizations')
        .select('org_status')
        .eq('id', orgId)
        .single();

    if (org?.org_status === 'pending') {
        throw new Error('Organisationen väntar på godkännande. Du kan inte skapa eller redigera rum.');
    }
}

export async function createRoom(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    // Get organization (assuming single org context for now or passed in formData)
    // If org_id is passed in formData use it, otherwise try to find one
    let org_id = formData.get("org_id") as string;
    if (!org_id) {
        const { data: myOrgs } = await supabase.from("org_user").select("org_id").eq("profile_id", profile.id).gte("role_id", 1).limit(1).single();
        if (!myOrgs) throw new Error("No organization access");
        org_id = myOrgs.org_id;
    }

    await checkOrgStatus(org_id, supabase);

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 0;
    const image_url = formData.get("image_url") as string;
    const is_bookable = formData.get("is_bookable") === 'true';
    const needs_approval = formData.get("needs_approval") === 'true';

    const { data, error } = await supabase.from("rooms").insert({
        org_id,
        name,
        description,
        capacity,
        image_url,
        is_bookable,
        needs_approval,
        created_by: profile.id
    }).select("id").single();

    if (error) {
        console.error("Create room error:", error);
        throw new Error("Failed to create room");
    }

    revalidatePath("/staff/rum");
    return data.id;
}

export async function updateRoom(roomId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check Org Status
    const { data: existingRoom } = await supabase
        .from("rooms")
        .select("org_id")
        .eq("id", roomId)
        .single();

    if (existingRoom) {
        await checkOrgStatus(existingRoom.org_id, supabase);
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const capacity = parseInt(formData.get("capacity") as string) || 0;
    const image_url = formData.get("image_url") as string;
    const is_bookable = formData.get("is_bookable") === 'true';
    const needs_approval = formData.get("needs_approval") === 'true';

    const { error } = await supabase.from("rooms").update({
        name,
        description,
        capacity,
        image_url,
        is_bookable,
        needs_approval,
        updated_at: new Date().toISOString()
    }).eq("id", roomId);

    if (error) {
        console.error("Update room error:", error);
        throw new Error("Failed to update room");
    }

    revalidatePath("/staff/rum");
    revalidatePath(`/staff/rum/${roomId}`);
}

export async function deleteRoom(roomId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("rooms").delete().eq("id", roomId);

    if (error) {
        console.error("Delete room error:", error);
        throw new Error("Failed to delete room");
    }

    revalidatePath("/staff/rum");
    redirect("/staff/rum");
}

export async function getRoomTimeSlotRules(roomId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("room_time_slot_rules")
        .select("*")
        .eq("room_id", roomId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Get time slot rules error:", error);
        throw new Error("Failed to fetch time slot rules");
    }

    return data;
}

export async function createRoomTimeSlotRule(roomId: string, dayOfWeek: number, startTime: string, endTime: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    const { data, error } = await supabase.from("room_time_slot_rules").insert({
        room_id: roomId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        effective_from: new Date().toISOString().split('T')[0], // Today
        created_by: profile.id
    }).select().single();

    if (error) {
        console.error("Create time slot rule error:", error);
        throw new Error("Failed to create time slot rule");
    }

    revalidatePath(`/staff/rum/${roomId}`);
    return data;
}

export async function deleteRoomTimeSlotRule(ruleId: string, roomId: string) {
    const supabase = await createClient();

    const { error } = await supabase.from("room_time_slot_rules").delete().eq("id", ruleId);

    if (error) {
        console.error("Delete time slot rule error:", error);
        throw new Error("Failed to delete time slot rule");
    }

    revalidatePath(`/staff/rum/${roomId}`);
}

'use server'

import { createClient, createAdminClient } from "@/utils/supabase/server";
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

async function checkStaffAccess(orgId: string, profileId: string, supabase: any) {
    const { data: orgUser } = await supabase
        .from('org_user')
        .select('role_id')
        .eq('org_id', orgId)
        .eq('profile_id', profileId)
        .single();

    if (!orgUser || orgUser.role_id < 1) {
        throw new Error("Unauthorized: You do not have staff access to this organization.");
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
    const required_perk_id = formData.get("required_perk_id") as string || null;

    const status = is_bookable ? 'ACTIVE' : 'INACTIVE';
    const booking_rule = required_perk_id ? 'REQUIRES_PERK' : 'MEMBERS_ONLY';

    // Generate slug
    const slug = name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();

    const { data, error } = await supabase.from("rooms").insert({
        org_id,
        name,
        slug,
        description,
        capacity,
        image_url,
        status,
        requires_approval: needs_approval,
        booking_rule,
        required_perk_id,
        created_by: profile.id
    }).select("id").single();

    if (error) {
        console.error("Create room error:", error);
        throw new Error(`Failed to create room: ${error.message} (${error.details || ''})`);
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
    const required_perk_id = formData.get("required_perk_id") as string || null;

    const status = is_bookable ? 'ACTIVE' : 'INACTIVE';
    const booking_rule = required_perk_id ? 'REQUIRES_PERK' : 'MEMBERS_ONLY';

    const { error } = await supabase.from("rooms").update({
        name,
        description,
        capacity,
        image_url,
        status,
        requires_approval: needs_approval,
        booking_rule,
        required_perk_id,
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

export async function createBooking(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    const room_id = formData.get("room_id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const start_time = formData.get("start_time") as string;
    const end_time = formData.get("end_time") as string;
    const status = (formData.get("status") as string || "APPROVED").toUpperCase();
    const booked_for_id = formData.get("booked_for_id") as string;

    const profile_id = booked_for_id || profile.id;

    // Fetch org_id from room
    const { data: room } = await supabase.from("rooms").select("org_id").eq("id", room_id).single();
    if (!room) throw new Error("Room not found");

    // Verify staff access
    await checkStaffAccess(room.org_id, profile.id, supabase);

    // Manual conflict check using regular client (respects RLS, but might recurse? No, RPC should be fine if called directly?)
    // Actually, if the RPC itself causes recursion via RLS, we might need to use admin client for the RPC too?
    // Let's try using the regular client for the RPC first. If that fails, we use admin.
    // Wait, the error was "infinite recursion detected in policy for relation room_bookings".
    // This happens when the policy calls a function that queries the table, which triggers the policy again.
    // So even reading with regular client might trigger it if the RPC reads room_bookings.
    // SAFE BET: Use admin client for the RPC check as well, since we are manually enforcing the logic.

    const adminSupabase = await createAdminClient();

    const { data: hasConflict, error: conflictError } = await adminSupabase.rpc('has_room_booking_conflict', {
        room_uuid: room_id,
        start_time: start_time,
        end_time: end_time,
        exclude_booking_id: null
    });

    if (conflictError) {
        console.error("Conflict check error:", conflictError);
        throw new Error("Failed to check for booking conflicts");
    }

    if (hasConflict) {
        throw new Error("Rummet är redan bokat den valda tiden.");
    }

    const { error } = await adminSupabase.from("room_bookings").insert({
        room_id,
        org_id: room.org_id,
        title,
        description,
        starts_at: start_time,
        ends_at: end_time,
        status,
        profile_id: profile_id,
        requires_approval: false, // Staff bookings don't need approval by default
        approved_by: status === 'APPROVED' ? profile.id : null,
        approved_at: status === 'APPROVED' ? new Date().toISOString() : null
    });

    if (error) {
        console.error("Create booking error object:", JSON.stringify(error, null, 2));
        throw new Error(`Failed to create booking: ${error.message} (${error.details || 'no details'})`);
    }

    revalidatePath("/staff/rum");
}

export async function updateBooking(bookingId: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const start_time = formData.get("start_time") as string;
    const end_time = formData.get("end_time") as string;
    const status = formData.get("status") as string;
    const room_id = formData.get("room_id") as string; // Ensure room_id is passed or fetched if needed for conflict check

    // We need room_id for conflict check. If not in formData, we'd need to fetch it.
    // BookingModal passes room_id in formData for create, but maybe not for update?
    // Let's fetch the existing booking to get room_id if needed, or assume it's not changing room (which the modal disables).
    // Better to fetch it to be safe.

    const adminSupabase = await createAdminClient();

    // Get current booking details for room_id
    const { data: currentBooking } = await adminSupabase.from("room_bookings").select("room_id").eq("id", bookingId).single();
    if (!currentBooking) throw new Error("Booking not found");

    const checkRoomId = room_id || currentBooking.room_id;

    // Fetch room to get org_id for permission check
    const { data: room } = await supabase.from("rooms").select("org_id").eq("id", checkRoomId).single();
    if (!room) throw new Error("Room not found");

    // Get profile for permission check
    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    // Verify staff access
    await checkStaffAccess(room.org_id, profile.id, supabase);

    const { data: hasConflict, error: conflictError } = await adminSupabase.rpc('has_room_booking_conflict', {
        room_uuid: checkRoomId,
        start_time: start_time,
        end_time: end_time,
        exclude_booking_id: bookingId
    });

    if (conflictError) {
        console.error("Conflict check error:", conflictError);
        throw new Error("Failed to check for booking conflicts");
    }

    if (hasConflict) {
        throw new Error("Rummet är redan bokat den valda tiden.");
    }

    const { error } = await adminSupabase.from("room_bookings").update({
        title,
        description,
        starts_at: start_time,
        ends_at: end_time,
        status,
        updated_at: new Date().toISOString()
    }).eq("id", bookingId);

    if (error) {
        console.error("Update booking error:", error);
        throw new Error("Failed to update booking");
    }

    revalidatePath("/staff/rum");
}

export async function deleteBooking(bookingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminSupabase = await createAdminClient();

    // Get booking to find room and org
    const { data: booking } = await adminSupabase.from("room_bookings").select("room_id").eq("id", bookingId).single();
    if (!booking) throw new Error("Booking not found");

    // Fetch room to get org_id
    const { data: room } = await supabase.from("rooms").select("org_id").eq("id", booking.room_id).single();
    if (!room) throw new Error("Room not found");

    // Get profile
    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) throw new Error("Profile not found");

    // Verify staff access
    await checkStaffAccess(room.org_id, profile.id, supabase);

    const { error } = await adminSupabase.from("room_bookings").delete().eq("id", bookingId);

    if (error) {
        console.error("Delete booking error:", error);
        throw new Error("Failed to delete booking");
    }

    revalidatePath("/staff/rum");
}

export async function createPerk(orgId: string, title: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Verify user has access to this org
    const { data: orgUser } = await supabase
        .from("org_user")
        .select("role_id")
        .eq("org_id", orgId)
        .eq("profile_id", (await supabase.from("profiles").select("id").eq("user_id", user.id).single()).data?.id)
        .single();

    if (!orgUser) throw new Error("Unauthorized");

    // Generate slug
    const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();

    const { data, error } = await supabase.from("perk_types").insert({
        org_id: orgId,
        name: title, // Map title to name
        slug: slug,
        category: 'ROOM_ACCESS'
    }).select().single();

    if (error) {
        console.error("Create perk error:", error);
        throw new Error(`Failed to create perk: ${error.message} (${error.details || ''})`);
    }

    revalidatePath("/staff/rum/new");
    revalidatePath(`/staff/rum/[id]`);

    // Map back to expected interface if needed, or just return data
    return {
        id: data.id,
        title: data.name // Map name back to title for frontend compatibility if we don't change frontend yet
    };
}

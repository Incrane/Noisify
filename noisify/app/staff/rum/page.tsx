import { createClient } from "@/utils/supabase/server";
import { getSelectedOrganization } from "../actions";
import RoomManager from "@/components/staff/room-manager";

export const revalidate = 0;

export default async function StaffRoomsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const selectedOrgId = await getSelectedOrganization();
  if (!selectedOrgId) return <div>Välj en organisation.</div>;

  // Fetch Rooms
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, required_perk_id, image_url, capacity, description, status, requires_approval")
    .eq("org_id", selectedOrgId)
    .order("name", { ascending: true });

  const roomIds = rooms?.map(r => r.id) || [];

  // Fetch Bookings (Active/Future/Recent)
  // Fetching all for now, can optimize later
  const { data: bookings } = await supabase
    .from("room_bookings")
    .select(`
        id,
        room_id,
        start_time,
        end_time,
        status,
        title,
        description,
        rooms (
            name
        )
    `)
    .in("room_id", roomIds);

  const formattedRooms = rooms?.map(r => ({
    room_id: r.id,
    rum_namn: r.name,
    required_perk_id: r.required_perk_id,
    image_url: r.image_url,
    capacity: r.capacity,
    description: r.description,
    status: r.status,
    requires_approval: r.requires_approval
  })) || [];

  const formattedBookings = bookings?.map(b => {
    // Handle potential array or object for joined relation
    // @ts-ignore - Supabase types can be tricky with joins
    const roomName = Array.isArray(b.rooms) ? b.rooms[0]?.name : b.rooms?.name;

    return {
      id: b.id,
      title: b.title || "Bokning",
      start: new Date(b.start_time),
      end: new Date(b.end_time),
      resourceId: b.room_id,
      status: b.status,
      room_name: roomName || "",
      room_id: b.room_id,
      description: b.description
    };
  }) || [];

  return (
    <RoomManager
      rooms={formattedRooms}
      bookings={formattedBookings}
      orgId={selectedOrgId}
    />
    // <div>Room Manager Temporarily Disabled</div>
  );
}

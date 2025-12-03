import { createClient } from "@/utils/supabase/server";
import RoomForm from "@/components/staff/room-form";
import { notFound } from "next/navigation";
import { getSelectedOrganization } from "../../actions";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const selectedOrgId = await getSelectedOrganization();
    if (!selectedOrgId) return <div>Välj en organisation.</div>;

    const { data: room } = await supabase.from("rooms").select("*").eq("id", id).single();

    if (!room) {
        return notFound();
    }

    if (room.org_id !== selectedOrgId) {
        return <div>Du har inte behörighet att redigera detta rum.</div>;
    }

    const { data: perks } = await supabase
        .from("perk_types")
        .select("id, title:name")
        .order("name");

    const roomData = {
        ...room,
        is_bookable: room.status === 'ACTIVE',
        needs_approval: room.requires_approval
    };

    return (
        <div className="space-y-6">
            <RoomForm initialData={roomData} orgId={room.org_id} perks={perks || []} />
        </div>
    );
}

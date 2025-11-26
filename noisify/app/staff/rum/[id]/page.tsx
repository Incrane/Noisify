import { createClient } from "@/utils/supabase/server";
import RoomForm from "@/components/staff/room-form";
import { notFound } from "next/navigation";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: room } = await supabase.from("rooms").select("*").eq("id", id).single();

    if (!room) {
        return notFound();
    }

    return (
         <div className="space-y-6">
            <RoomForm initialData={room} orgId={room.org_id} />
        </div>
    );
}

import { createClient } from "@/utils/supabase/server";
import RoomForm from "@/components/staff/room-form";

import { getSelectedOrganization } from "../../actions";

export default async function NewRoomPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Ej inloggad</div>;

    const selectedOrgId = await getSelectedOrganization();
    if (!selectedOrgId) return <div>Välj en organisation.</div>;

    const { data: perks } = await supabase
        .from("perk_types")
        .select("id, title:name")
        .order("name");

    return (
        <div>
            <RoomForm orgId={selectedOrgId} perks={perks || []} />
        </div>
    );
}

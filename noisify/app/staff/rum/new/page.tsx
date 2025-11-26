import { createClient } from "@/utils/supabase/server";
import RoomForm from "@/components/staff/room-form";

export default async function NewRoomPage() {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Ej inloggad</div>;

    const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
    if (!profile) return <div>Profil saknas</div>;

    const { data: myOrgs } = await supabase.from("org_user").select("org_id").eq("profile_id", profile.id).gte("role_id", 1).limit(1);
    
    if (!myOrgs || myOrgs.length === 0) {
        return <div>Du saknar behörighet att skapa rum.</div>;
    }

    const orgId = myOrgs[0].org_id;

    return (
        <div>
            <RoomForm orgId={orgId} />
        </div>
    );
}

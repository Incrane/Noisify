import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // Initialize admin client for deletion
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Get profile ID
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (profile) {
            const profileId = profile.id;

            // 1. Delete favorites
            await supabaseAdmin.from("activity_favorites").delete().eq("profile_id", profileId);
            await supabaseAdmin.from("course_favorites").delete().eq("profile_id", profileId);
            await supabaseAdmin.from("organization_favorites").delete().eq("profile_id", profileId);

            // 2. Delete notifications
            await supabaseAdmin.from("notifications").delete().eq("user_id", profileId);

            // 3. Delete registrations (activity signups)
            await supabaseAdmin.from("registration").delete().eq("profile_id", profileId);
            
            // 4. Delete chat participation
            // Note: Messages are usually kept or cascaded, but we remove the user from groups
            await supabaseAdmin.from("chat_participants").delete().eq("profile_id", profileId);

            // 5. Delete organization membership
            await supabaseAdmin.from("org_user").delete().eq("profile_id", profileId);

            // 6. Delete memberships (legacy/display)
            await supabaseAdmin.from("memberships").delete().eq("profile_id", profileId);

            // 7. Delete user settings
            await supabaseAdmin.from("user_settings").delete().eq("profile_id", profileId);

            // 8. Finally delete profile
            await supabaseAdmin.from("profiles").delete().eq("id", profileId);
        }

        // Delete auth user (this will cascade delete related data if configured in DB, 
        // but we manually cleaned up profile-linked data above to be safe)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (error) {
            console.error("Error deleting auth user:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        // Sign out the user from the current session
        await supabase.auth.signOut();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete account error:", error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}

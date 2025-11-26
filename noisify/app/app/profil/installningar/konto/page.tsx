import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditProfileForm from "../../edit-profile-form";
import ProfileHeader from "@/components/profile/profile-header";

// ... (imports)

export default async function AccountSettingsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

    const { data: cities } = await supabase
        .from("cities")
        .select("id, city")
        .order("city");

    // Fetch avatars
    const { data: avatarFiles } = await supabase.storage.from("avatars").list();
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl("");
    const avatars = avatarFiles?.map(file => ({
        name: file.name,
        url: `${publicUrl}/${file.name}`
    })) || [];

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/app/profil"
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <p className="text-sm text-slate-500">Tillbaka</p>
                    <h1 className="text-2xl font-bold text-slate-900">Konto</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Hantera dina kontoinställningar och personuppgifter.
                    </p>
                </div>
            </div>

            {/* Profile Header */}
            <ProfileHeader profile={profile} user={user} avatars={avatars} />

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-8">
                <div className="space-y-8">
                    <div className="">
                        <h3 className="font-semibold text-slate-900 mb-6 text-lg">
                            Redigera profil
                        </h3>
                        <EditProfileForm
                            initialAlias={profile?.alias || ""}
                            initialCityId={profile?.city_id}
                            initialAvatarUrl={profile?.image_url}
                            cities={cities || []}
                            avatars={avatars}
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-3 text-sm">
                        <div>
                            <span className="text-slate-500 block">Födelseår</span>
                            <span className="font-medium text-slate-900">
                                {profile?.fodd_ar || "Inte angivet"}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block">E-post</span>
                            <span className="font-medium text-slate-900">{user.email}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

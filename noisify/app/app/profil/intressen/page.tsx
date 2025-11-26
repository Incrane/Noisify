import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InterestToggle } from "./interest-toggle";

export default async function InterestsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: profile } = await supabase
        .from("v_user_profile")
        .select("profile_id")
        .eq("user_id", user.id)
        .single();

    // Fetch user's selected interests
    const { data: userInterests } = await supabase
        .from("profile_interests")
        .select("category_id")
        .eq("profile_id", profile?.profile_id);

    const selectedIds = new Set(userInterests?.map((i: any) => i.category_id));

    // Fetch all categories
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .order("cat_name");

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/app/profil">
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </div>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mina Intressen</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Välj intressen för att få personliga rekommendationer.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    {categories?.map((category: any) => {
                        const isSelected = selectedIds.has(category.id);
                        return (
                            <InterestToggle
                                key={category.id}
                                category={category}
                                isSelected={isSelected}
                                profileId={profile?.profile_id}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

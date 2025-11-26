import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MembershipCardStack } from "@/components/profile/membership-card-stack";

export default async function MembershipPage() {
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

    const { data: memberships } = await supabase
        .from("members_dashboard")
        .select("*")
        .eq("profile_id", profile?.profile_id)
        .order("membership_state", { ascending: true });

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/app/profil">
                    <div className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </div>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Mina Medlemskap</h1>
            </div>

            <div className="space-y-6">
                <MembershipCardStack memberships={memberships || []} />

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-800 text-sm">
                    <p className="font-medium mb-1">Om medlemskap</p>
                    <p>
                        Här ser du alla dina aktiva och tidigare medlemskap. Klicka på ett kort för att se mer detaljer om organisationen och dina förmåner.
                    </p>
                </div>
            </div>
        </div>
    );
}

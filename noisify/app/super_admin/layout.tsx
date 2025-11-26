import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import StaffSidebar from "@/components/staff/staff-sidebar";
import Link from "next/link";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Get Profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, alias")
        .eq("user_id", user.id)
        .single();

    if (!profile) redirect("/login");

    // STRICT SECURITY CHECK: Role 5 ONLY
    // We check if the user has role_id = 5 in ANY organization.
    // Since role 5 is a system-level role, it should be sufficient to check if they have it at all.
    // However, usually roles are tied to orgs.
    // If the user is a Super Admin, they should have role_id = 5 in at least one org (or a specific system org).
    // Based on the plan: "Checks if user_role.role_id === 5 (Super Admin)."
    // The table is `org_user`.

    const { data: superAdminRole } = await supabase
        .from("org_user")
        .select("role_id")
        .eq("profile_id", profile.id)
        .eq("role_id", 5)
        .single();

    if (!superAdminRole) {
        // Redirect to forbidden page or show 403
        // Using a custom forbidden page component or redirecting
        // For now, let's redirect to a dedicated 403 page to be clean
        redirect("/forbidden");
    }

    return (
        <div className="min-h-screen bg-slate-50/50 flex selection:bg-indigo-100 selection:text-indigo-900">
            <StaffSidebar
                userEmail={user.email!}
                alias={profile.alias || undefined}
                isSuperAdmin={true}
            />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Super Admin
                        </h1>
                        <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium">
                            System Level Access
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/staff" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                            Tillbaka till Staff Dashboard
                        </Link>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

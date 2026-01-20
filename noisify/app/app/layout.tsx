import { createClient } from "@/utils/supabase/server";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Home, LogOut, User, Building2, MessageCircle, Trophy } from "lucide-react";
import { signOut } from "@/app/login/actions";
import NotificationsDropdown from "@/components/notifications-dropdown";
import TopBar from "@/components/top-bar";
import CompleteProfileModal from "@/components/profile/complete-profile-modal";
import ForceAliasChangeModal from "@/components/profile/force-alias-change-modal";
import { getAvatars } from "@/app/app/profil/completion-actions";
import UnreadChatBadge from "@/components/unread-chat-badge";
import UserDropdown from "@/components/user-dropdown";
import MobileGreeting from "@/components/mobile-greeting";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallelize independent user data queries
  const [
    { data: profile },
    { data: privateInfo },
    { data: staffRoles }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, alias, city_id, target_subgroup, image_url, requires_alias_change')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('users_private')
      .select('first_name, last_name, phone_number, birth_date, gender_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('org_user')
      .select('role_id')
      .eq('user_id', user.id)
      .gte('role_id', 1)
  ]);

  // Check if user needs to change alias
  const requiresAliasChange = profile?.requires_alias_change === true;

  // Check if profile is complete
  const isProfileComplete =
    profile?.alias &&
    profile?.city_id &&
    profile?.target_subgroup &&
    privateInfo?.first_name &&
    privateInfo?.last_name;

  const isStaff = (staffRoles?.length || 0) > 0;

  let cities: any[] = [];
  let subgroups: any[] = [];
  let avatars: any[] = [];

  if (!isProfileComplete) {
    // Parallelize dropdown data fetching
    const [
      { data: citiesData },
      { data: subgroupsData },
      avatarsData
    ] = await Promise.all([
      supabase.from('cities').select('id, city').order('city'),
      supabase.from('target_subgroups').select('id, name').order('sort'),
      getAvatars()
    ]);
    cities = citiesData || [];
    subgroups = subgroupsData || [];
    avatars = avatarsData;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {!isProfileComplete && (
        <CompleteProfileModal
          isOpen={true}
          cities={cities}
          subgroups={subgroups}
          avatars={avatars}
          initialData={{
            alias: profile?.alias || user.user_metadata?.alias || "",
            firstName: privateInfo?.first_name || "",
            lastName: privateInfo?.last_name || "",
            cityId: profile?.city_id || "",
            targetSubgroup: profile?.target_subgroup || "",
            avatarUrl: profile?.image_url || "",
            phoneNumber: privateInfo?.phone_number || "",
            birthDate: privateInfo?.birth_date || user.user_metadata?.birth_date || "",
          }}
        />
      )}

      {/* Force alias change modal - shown when staff requires user to change alias */}
      {isProfileComplete && requiresAliasChange && profile && (
        <ForceAliasChangeModal
          isOpen={true}
          currentAlias={profile.alias || ''}
          profileId={profile.id}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Noisify</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link href="/app/aktiviteter" className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
            <Home className="w-5 h-5 group-hover:text-indigo-600" />
            <span className="font-medium">Aktiviteter</span>
          </Link>
          <Link href="/app/chatt" className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
            <MessageCircle className="w-5 h-5 group-hover:text-indigo-600" />
            <span className="font-medium flex-1">Chatt</span>
            <UnreadChatBadge />
          </Link>
          <Link href="/app/mina-anmalningar" className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
            <Calendar className="w-5 h-5 group-hover:text-indigo-600" />
            <span className="font-medium">Mina anmälningar</span>
          </Link>
          <Link href="/app/fritidsgardar" className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
            <Building2 className="w-5 h-5 group-hover:text-indigo-600" />
            <span className="font-medium">Fritidsgårdar</span>
          </Link>
          <Link href="/app/turneringar" className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
            <Trophy className="w-5 h-5 group-hover:text-indigo-600" />
            <span className="font-medium">Turneringar</span>
            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">NY</span>
          </Link>
          <Link href="/app/profil" className="flex items-center gap-3 px-4 py-3 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors group">
            <User className="w-5 h-5 group-hover:text-indigo-600" />
            <span className="font-medium">Profil</span>
          </Link>
        </nav>

        {/* Sidebar Footer (Settings etc could go here) */}
        <div className="p-4 border-t border-slate-100">
          {/* Placeholder for future settings link */}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-30 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Noisify</span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationsDropdown userId={user.id} />
          <UserDropdown
            userEmail={user.email || ''}
            userAlias={profile?.alias}
            userAvatar={profile?.image_url}
            isStaff={isStaff}
          />
        </div>
      </header>



      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen md:pt-24">
        <div className="hidden md:block">
          <Suspense fallback={<div className="h-20 bg-white border-b border-slate-200" />}>
            <TopBar
              userEmail={user.email || ''}
              userId={user.id}
              userAlias={profile?.alias}
              userAvatar={profile?.image_url}
              isStaff={isStaff}
            />
          </Suspense>
        </div>

        {/* Mobile Greeting & Search */}
        <MobileGreeting alias={profile?.alias || 'Användare'} />

        <div className="flex-1 md:p-8 p-4 pb-24 md:pb-8 max-w-screen-2xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-30">
        <div className="grid grid-cols-5 h-16">
          <Link href="/app/aktiviteter" className="flex flex-col items-center justify-center text-slate-600 hover:text-indigo-600 active:text-indigo-600">
            <Home className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Aktiviteter</span>
          </Link>
          <Link href="/app/chatt" className="flex flex-col items-center justify-center text-slate-600 hover:text-indigo-600 active:text-indigo-600 relative">
            <div className="relative">
              <MessageCircle className="w-6 h-6 mb-1" />
              <UnreadChatBadge className="absolute -top-1 -right-1" />
            </div>
            <span className="text-[10px] font-medium">Chatt</span>
          </Link>
          <Link href="/app/mina-anmalningar" className="flex flex-col items-center justify-center text-slate-600 hover:text-indigo-600 active:text-indigo-600">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Anmälningar</span>
          </Link>
          <Link href="/app/fritidsgardar" className="flex flex-col items-center justify-center text-slate-600 hover:text-indigo-600 active:text-indigo-600">
            <Building2 className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Gårdar</span>
          </Link>
          <Link href="/app/profil" className="flex flex-col items-center justify-center text-slate-600 hover:text-indigo-600 active:text-indigo-600">
            <User className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

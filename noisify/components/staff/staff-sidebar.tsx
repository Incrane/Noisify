'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Calendar, BookOpen, DoorOpen, Medal, Trophy, Settings, LogOut, ChevronDown, Users, UserCog, BarChart3, MessageSquare, ArrowLeftRight, Gamepad2, ChevronsLeft, ChevronsRight } from "lucide-react";
import { signOut } from "@/app/login/actions";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { useEffect } from "react";

export default function StaffSidebar({
  userEmail,
  alias,
  className,
  onLinkClick,
  orgStatus,
  isSuperAdmin = false,
  currentOrgId
}: {
  userEmail: string;
  alias?: string;
  className?: string;
  onLinkClick?: () => void;
  orgStatus?: 'pending' | 'active' | 'inactive' | 'suspended';
  isSuperAdmin?: boolean;
  currentOrgId?: string;
}) {
  const pathname = usePathname();
  const [isVerksamhetOpen, setIsVerksamhetOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const isPending = orgStatus === 'pending';
  const supabase = createClient();

  useEffect(() => {
    const collapsed = localStorage.getItem('staff-sidebar-collapsed');
    if (collapsed === 'true') {
      setIsCollapsed(true);
      setIsVerksamhetOpen(false);
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('staff-sidebar-collapsed', String(newState));
    if (newState) {
      setIsVerksamhetOpen(false);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      // Fetch unread chat count
      const { data: chatData, error: chatError } = await supabase.rpc('get_unread_chat_count');
      if (!chatError && chatData) {
        setUnreadCount(chatData);
      }

      // Fetch pending members count if we have an org context
      if (currentOrgId) {
        const { count, error: pendingError } = await supabase
          .from('memberships')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', currentOrgId)
          .eq('membership_state', 'pending');

        if (!pendingError && count !== null) {
          setPendingMembersCount(count);
        }
      }
    };

    fetchCounts();

    // Poll every 30s
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [currentOrgId]);

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const linkClass = (path: string, exact = false) => cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
    isActive(path, exact)
      ? "bg-indigo-50 text-indigo-600 font-medium"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    isPending && path !== '/staff' && path !== '/staff/installningar' && "opacity-50 pointer-events-none",
    isCollapsed && "justify-center px-2"
  );

  const subLinkClass = (path: string) => cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group text-sm",
    isActive(path)
      ? "bg-indigo-50 text-indigo-600 font-medium"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    isPending && path !== '/staff/installningar' && "opacity-50 pointer-events-none",
    isCollapsed && "justify-center px-2"
  );

  const iconClass = (path: string, exact = false) => cn(
    "w-5 h-5 transition-colors",
    isActive(path, exact)
      ? "text-indigo-600"
      : "text-slate-400 group-hover:text-indigo-600"
  );

  const subIconClass = (path: string) => cn(
    "w-4 h-4 transition-colors",
    isActive(path)
      ? "text-indigo-600"
      : "text-slate-400 group-hover:text-indigo-600"
  );

  return (
    <aside className={cn(
      "bg-white border-r border-slate-200/60 shrink-0 flex-col h-screen sticky top-0 z-50 shadow-sm hidden md:flex transition-all duration-300",
      isCollapsed ? "w-20" : "w-72",
      className
    )}>
      {/* Header */}
      <div className={cn("p-6 pb-4 flex flex-col", isCollapsed && "items-center px-2")}>
        <div className={cn("flex items-center gap-2 mb-6", isCollapsed && "justify-center mb-4")}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          {!isCollapsed && <h1 className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">Noisify</h1>}
        </div>

        {!isCollapsed ? (
          <Link
            href="/app/aktiviteter"
            onClick={handleLinkClick}
            className="group flex items-center justify-center w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98] text-sm whitespace-nowrap"
          >
            Tillbaka till appen
          </Link>
        ) : (
          <Link
            href="/app/aktiviteter"
            onClick={handleLinkClick}
            className="group flex items-center justify-center w-10 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            title="Tillbaka till appen"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 space-y-1 overflow-y-auto py-2 scrollbar-hide", isCollapsed ? "px-2" : "px-3")}>
        <div className={cn("py-2", isCollapsed ? "px-0" : "px-3")}>
          {!isCollapsed && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Översikt</p>}
          <Link
            href="/staff"
            onClick={handleLinkClick}
            className={linkClass('/staff', true)}
          >
            <LayoutDashboard className={iconClass('/staff', true)} />
            {!isCollapsed && <span className="font-medium">Dashboard</span>}
          </Link>
        </div>

        {isSuperAdmin && (
          <div className={cn("py-2", isCollapsed ? "px-0" : "px-3")}>
            {!isCollapsed && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Super Admin</p>}
            <Link
              href="/super_admin"
              onClick={handleLinkClick}
              className={linkClass('/super_admin')}
            >
              <LayoutDashboard className={iconClass('/super_admin')} />
              {!isCollapsed && <span className="font-medium">Super Admin</span>}
            </Link>
          </div>
        )}

        <div className={cn("py-2", isCollapsed ? "px-0" : "px-3")}>
          {!isCollapsed && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Administration</p>}
          <div className="space-y-1">
            <div className="relative">
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setIsVerksamhetOpen(true);
                    localStorage.setItem('staff-sidebar-collapsed', 'false');
                  } else {
                    setIsVerksamhetOpen(!isVerksamhetOpen);
                  }
                }}
                className={cn(
                  "w-full flex items-center rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group text-left",
                  isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
                )}
              >
                <span className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  {!isCollapsed && <span className="font-medium">Verksamhet</span>}
                </span>
                {!isCollapsed && <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isVerksamhetOpen ? 'rotate-180' : ''}`} />}
              </button>

              {isVerksamhetOpen && !isCollapsed && (
                <div className="mt-1 ml-3 pl-3 border-l border-slate-100 space-y-1">
                  <Link href="/staff/medlemmar" onClick={handleLinkClick} className={subLinkClass('/staff/medlemmar')}>
                    <Users className={subIconClass('/staff/medlemmar')} />
                    <span className="font-medium flex-1">Medlemmar</span>
                    {pendingMembersCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                        {pendingMembersCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/staff/verksamhet/personal" onClick={handleLinkClick} className={subLinkClass('/staff/verksamhet/personal')}>
                    <UserCog className={subIconClass('/staff/verksamhet/personal')} />
                    <span className="font-medium">Personal</span>
                  </Link>
                  <Link href="/staff/installningar" onClick={handleLinkClick} className={subLinkClass('/staff/installningar')}>
                    <Settings className={subIconClass('/staff/installningar')} />
                    <span className="font-medium">Inställningar</span>
                  </Link>
                  <Link href="/staff/statistik" onClick={handleLinkClick} className={subLinkClass('/staff/statistik')}>
                    <BarChart3 className={subIconClass('/staff/statistik')} />
                    <span className="font-medium">Statistik</span>
                  </Link>
                </div>
              )}
            </div>

            <Link href="/staff/aktiviteter" onClick={handleLinkClick} className={linkClass('/staff/aktiviteter')}>
              <Calendar className={iconClass('/staff/aktiviteter')} />
              {!isCollapsed && <span className="font-medium">Aktiviteter</span>}
            </Link>

            <Link href="/staff/kurser" onClick={handleLinkClick} className={linkClass('/staff/kurser')}>
              <BookOpen className={iconClass('/staff/kurser')} />
              {!isCollapsed && <span className="font-medium">Kurser</span>}
            </Link>

            <Link href="/staff/rum" onClick={handleLinkClick} className={linkClass('/staff/rum')}>
              <DoorOpen className={iconClass('/staff/rum')} />
              {!isCollapsed && <span className="font-medium">Rumsbokningar</span>}
            </Link>
          </div>
        </div>

        <div className={cn("py-2", isCollapsed ? "px-0" : "px-3")}>
          {!isCollapsed && <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Verktyg</p>}
          <div className="space-y-1">
            <Link href="/staff/chatt" onClick={handleLinkClick} className={linkClass('/staff/chatt')}>
              <MessageSquare className={iconClass('/staff/chatt')} />
              {!isCollapsed && <span className="font-medium flex-1">Chatt</span>}
              {unreadCount > 0 && (
                <span className={cn(
                  "bg-red-500 text-white text-[10px] font-bold rounded-full text-center",
                  isCollapsed ? "absolute top-1 right-1 w-2.5 h-2.5 p-0 border-2 border-white" : "px-1.5 py-0.5 min-w-5"
                )}>
                  {!isCollapsed && unreadCount}
                </span>
              )}
            </Link>

            {/* Live Quiz Link */}
            <Link href="/staff/quiz" onClick={handleLinkClick} className={linkClass('/staff/quiz')}>
              <Gamepad2 className={iconClass('/staff/quiz')} />
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1">Live Quiz</span>
                  <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">NY</span>
                </>
              )}
            </Link>

            <Link href="#" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all group cursor-not-allowed opacity-70", isCollapsed && "justify-center px-2")}>
              <ArrowLeftRight className="w-5 h-5 text-slate-400 group-hover:text-slate-500 transition-colors" />
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1">Utlåningar</span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">SNART</span>
                </>
              )}
            </Link>

            <Link href="#" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all group cursor-not-allowed opacity-70", isCollapsed && "justify-center px-2")}>
              <Medal className="w-5 h-5 text-slate-400 group-hover:text-slate-500 transition-colors" />
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1">Meritpoäng</span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">SNART</span>
                </>
              )}
            </Link>

            <Link href="#" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all group cursor-not-allowed opacity-70", isCollapsed && "justify-center px-2")}>
              <Trophy className="w-5 h-5 text-slate-400 group-hover:text-slate-500 transition-colors" />
              {!isCollapsed && (
                <>
                  <span className="font-medium flex-1">Turneringar</span>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">SNART</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("p-4 border-t border-slate-100 bg-slate-50/50", isCollapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer group", isCollapsed && "justify-center px-0")}>
          <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white shrink-0">
            {alias?.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate text-sm">{alias || 'Användare'}</div>
                <div className="text-xs text-slate-500 truncate">{userEmail}</div>
              </div>
              <Link href="/staff/installningar" onClick={handleLinkClick} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
        {!isCollapsed ? (
          <form action={signOut} className="mt-2">
            <button className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Logga ut
            </button>
          </form>
        ) : (
          <div className="mt-2 flex flex-col gap-2 items-center">
            <Link href="/staff/installningar" onClick={handleLinkClick} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors" title="Inställningar">
              <Settings className="w-4 h-4" />
            </Link>
            <form action={signOut}>
              <button className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Logga ut">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          className="w-full mt-4 flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

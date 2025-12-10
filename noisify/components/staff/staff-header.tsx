'use client'
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import OrgSwitcher from "./org-switcher"
import AppSwitcher from "./app-switcher"
import { ChevronRight, Home, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import StaffSidebar from "./staff-sidebar"
import { createClient } from "@/utils/supabase/client"
import { useEffect } from "react"
import NotificationsDropdown from "@/components/notifications-dropdown"
import StaffUserMenu from "./staff-user-menu"

interface Org {
  org_id: string;
  organizations: {
    id: string;
    org_namn: string;
    org_status: 'pending' | 'active' | 'inactive' | 'suspended';
  } | null;
}

export default function StaffHeader({
  organizations,
  currentOrgId,
  orgStatus
}: {
  organizations: Org[];
  currentOrgId?: string;
  orgStatus?: 'pending' | 'active' | 'inactive' | 'suspended';
}) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const [userAlias, setUserAlias] = useState<string | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        // Fetch profile for alias
        const { data: profile } = await supabase
          .from("profiles")
          .select("alias")
          .eq("user_id", user.id)
          .single()
        if (profile) {
          setUserAlias(profile.alias)
        }
      }
    }
    getUser()
  }, [])

  // Generate breadcrumbs (simple)
  const paths = pathname.split('/').filter(p => p)
  const breadcrumbs = paths.map((p, i) => {
    const href = `/${paths.slice(0, i + 1).join('/')}`
    const label = p.charAt(0).toUpperCase() + p.slice(1)
    return { href, label }
  })

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-all">
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile Menu Trigger */}
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0">
            <SheetTitle className="sr-only">Staff Menu</SheetTitle>
            <StaffSidebar
              userEmail={userEmail}
              alias={userAlias}
              orgStatus={orgStatus}
              className="flex w-full border-none shadow-none h-full"
              onLinkClick={() => setIsMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <OrgSwitcher organizations={organizations} currentOrgId={currentOrgId} />

        {/* Breadcrumbs - Modern version */}
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 border-l border-slate-200 pl-6 h-8">
          <Link href="/staff" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
          </Link>

          {breadcrumbs.length > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}

          {breadcrumbs.map((b, i) => (
            <div key={b.href} className="flex items-center gap-2">
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-xs uppercase tracking-wide">
                  {b.label === 'Staff' ? 'Dashboard' : b.label}
                </span>
              ) : (
                <>
                  <Link href={b.href} className="hover:text-slate-900 transition-colors font-medium">
                    {b.label === 'Staff' ? 'Dashboard' : b.label}
                  </Link>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {orgStatus === 'pending' && (
          <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            Väntar på godkännande
          </span>
        )}
        <NotificationsDropdown />
        <div className="hidden md:block">
          <StaffUserMenu userEmail={userEmail} alias={userAlias} />
        </div>
        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
        <AppSwitcher />
      </div>
    </header>
  )
}


'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, ChevronLeft } from "lucide-react"
import AppSwitcher from "@/components/staff/app-switcher"

interface PlanifyHeaderProps {
  userAlias: string
  orgName: string
  currentOrgId: string
}

export default function PlanifyHeader({ userAlias, orgName }: PlanifyHeaderProps) {
  const pathname = usePathname()
  const isInPlan = pathname.includes('/planify/') && pathname !== '/planify'

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {isInPlan ? (
          <Link
            href="/planify"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Tillbaka till planer</span>
          </Link>
        ) : (
          <Link href="/planify" className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">Planify</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500 hidden sm:block">{orgName}</span>
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
        <span className="text-sm font-medium text-slate-700">{userAlias}</span>
        <div className="h-6 w-px bg-slate-200"></div>
        <AppSwitcher />
      </div>
    </header>
  )
}

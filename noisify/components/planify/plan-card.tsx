'use client'

import Link from "next/link"
import { Calendar, Users, MoreVertical, Trash2, Pencil } from "lucide-react"
import type { Plan } from "@/app/planify/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { deletePlan } from "@/app/planify/actions"
import { useRouter } from "next/navigation"

interface PlanCardProps {
  plan: Plan
}

export default function PlanCard({ plan }: PlanCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm("Är du säker på att du vill ta bort denna plan? Detta går inte att ångra.")) {
      return
    }

    setIsDeleting(true)
    const { error } = await deletePlan(plan.id)

    if (error) {
      alert(`Kunde inte ta bort planen: ${error}`)
      setIsDeleting(false)
    } else {
      router.refresh()
    }
  }

  const formatDateRange = () => {
    if (!plan.start_date && !plan.end_date) return null

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

    if (plan.start_date && plan.end_date) {
      const start = new Date(plan.start_date).toLocaleDateString('sv-SE', options)
      const end = new Date(plan.end_date).toLocaleDateString('sv-SE', options)
      return `${start} - ${end}`
    }

    if (plan.start_date) {
      return `Från ${new Date(plan.start_date).toLocaleDateString('sv-SE', options)}`
    }

    if (plan.end_date) {
      return `Till ${new Date(plan.end_date).toLocaleDateString('sv-SE', options)}`
    }
  }

  const dateRange = formatDateRange()

  return (
    <Link
      href={`/planify/${plan.id}`}
      className={`group block bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200 ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Cover Image or Placeholder */}
      <div className="h-32 bg-gradient-to-br from-orange-100 to-amber-50 relative">
        {plan.cover_image_url ? (
          <img
            src={plan.cover_image_url}
            alt={plan.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-orange-300" />
          </div>
        )}

        {/* Menu Button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.preventDefault()}
                className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-slate-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault()
                  router.push(`/planify/${plan.id}/settings`)
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Redigera
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Ta bort
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Shared Badge */}
        {plan.is_shared && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-white/90 text-xs font-medium text-slate-600 rounded-md">
              Delad
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
          {plan.name}
        </h3>

        {plan.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {plan.description}
          </p>
        )}

        {/* Date Range */}
        {dateRange && (
          <p className="text-xs text-slate-400 mt-2">{dateRange}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{plan.activity_count || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Users className="w-4 h-4" />
            <span className="text-sm">{plan.member_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

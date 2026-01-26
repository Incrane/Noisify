import { getPlan } from "../actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, List, Plus, Settings, ChevronLeft } from "lucide-react"

interface PlanPageProps {
  params: Promise<{ planId: string }>
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { planId } = await params
  const { plan, error } = await getPlan(planId)

  if (error || !plan) {
    notFound()
  }

  const formatDateRange = () => {
    if (!plan.start_date && !plan.end_date) return null

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Plan Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/planify"
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{plan.name}</h1>
              {dateRange && (
                <p className="text-sm text-slate-500">{dateRange}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Ny aktivitet
              </button>
              <Link
                href={`/planify/${planId}/settings`}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md shadow-sm text-slate-900 font-medium text-sm">
              <Calendar className="w-4 h-4" />
              Kalender
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm">
              <List className="w-4 h-4" />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Calendar/Activities Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-orange-100 rounded-full">
                <Calendar className="w-10 h-10 text-orange-500" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Inga aktiviteter ännu
            </h2>
            <p className="text-slate-500 max-w-sm mx-auto mb-6">
              Skapa din första aktivitet för att börja planera {plan.name}.
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
              <Plus className="w-5 h-5" />
              Skapa aktivitet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

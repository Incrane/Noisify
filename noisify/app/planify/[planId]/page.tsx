import { getPlan } from "../actions"
import { getActivities } from "./actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, List, Plus, Settings, ChevronLeft } from "lucide-react"
import CreateActivityDialog from "@/components/planify/create-activity-dialog"

interface PlanPageProps {
  params: Promise<{ planId: string }>
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { planId } = await params
  const [{ plan, error }, { activities }] = await Promise.all([
    getPlan(planId),
    getActivities(planId)
  ])

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

  const formatActivityTime = (startTime: string, endTime: string, isAllDay: boolean) => {
    if (isAllDay) return "Heldag"

    const start = new Date(startTime)
    const end = new Date(endTime)

    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }

    return `${start.toLocaleTimeString('sv-SE', timeOptions)} - ${end.toLocaleTimeString('sv-SE', timeOptions)}`
  }

  const formatActivityDate = (startTime: string) => {
    const date = new Date(startTime)
    return date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

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
              <CreateActivityDialog planId={planId} />
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
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Category color bar */}
                    <div
                      className="w-1 h-16 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activity.category?.color || '#6B7280' }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{activity.title}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {formatActivityDate(activity.start_time)} • {formatActivityTime(activity.start_time, activity.end_time, activity.is_all_day)}
                          </p>
                          {activity.location && (
                            <p className="text-sm text-slate-400 mt-1">{activity.location}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {activity.category && (
                            <span
                              className="px-2 py-1 text-xs font-medium rounded-full"
                              style={{
                                backgroundColor: `${activity.category.color}20`,
                                color: activity.category.color
                              }}
                            >
                              {activity.category.name}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            activity.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : activity.status === 'ready'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {activity.status === 'published' ? 'Publicerad' : activity.status === 'ready' ? 'Klar' : 'Utkast'}
                          </span>
                        </div>
                      </div>

                      {activity.description && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
              <CreateActivityDialog
                planId={planId}
                trigger={
                  <button className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                    <Plus className="w-5 h-5" />
                    Skapa aktivitet
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

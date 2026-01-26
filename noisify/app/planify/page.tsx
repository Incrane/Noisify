import { getPlans } from "./actions"
import PlanCard from "@/components/planify/plan-card"
import CreatePlanDialog from "@/components/planify/create-plan-dialog"
import { Calendar, FolderOpen } from "lucide-react"

export const revalidate = 60

export default async function PlanifyPage() {
  const { plans, error } = await getPlans()

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">Ett fel uppstod: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Planer
          </h1>
          <p className="text-slate-500 mt-1">
            Planera och koordinera aktiviteter innan de publiceras
          </p>
        </div>
        <CreatePlanDialog />
      </div>

      {/* Plans Grid */}
      {plans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-100 rounded-full">
              <FolderOpen className="w-10 h-10 text-slate-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Inga planer ännu
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Skapa din första plan för att börja koordinera aktiviteter med ditt team.
          </p>
          <CreatePlanDialog variant="primary" />
        </div>
      )}
    </div>
  )
}

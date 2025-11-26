'use client'

import { Building2 } from 'lucide-react'
import { selectOrganization } from '@/app/staff/actions'
import { useRouter } from 'next/navigation'

interface Org {
  org_id: string;
  organizations: {
    id: string;
    org_namn: string;
  } | null;
}

export default function SelectOrgView({ organizations }: { organizations: Org[] }) {
  const router = useRouter()

  const handleSelect = async (orgId: string) => {
    await selectOrganization(orgId)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
       <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
           <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
               <Building2 className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 mb-2">Välj verksamhet</h1>
           <p className="text-slate-500 mb-8">Välj vilken verksamhet du vill administrera</p>
           
           <div className="space-y-3">
               {organizations.map((org) => (
                   <button
                       key={org.org_id}
                       onClick={() => handleSelect(org.org_id)}
                       className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left group"
                   >
                       <div className="p-2 bg-white rounded-lg shadow-sm text-slate-600 group-hover:text-indigo-600 transition-colors">
                           <Building2 className="w-5 h-5" />
                       </div>
                       <span className="font-medium text-slate-900">{org.organizations?.org_namn}</span>
                   </button>
               ))}
           </div>
       </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Building2 } from 'lucide-react'
import { selectOrganization } from '@/app/staff/actions'
import { useRouter } from 'next/navigation'
import CreateOrgModal from './create-org-modal'

interface Org {
  org_id: string;
  organizations: {
    id: string;
    org_namn: string;
  } | null;
}

export default function OrgSwitcher({ 
  organizations, 
  currentOrgId 
}: { 
  organizations: Org[]; 
  currentOrgId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentOrg = organizations.find(o => o.org_id === currentOrgId)?.organizations

  const handleSelect = async (orgId: string) => {
    await selectOrganization(orgId)
    setIsOpen(false)
    router.refresh()
  }

  const handleCreateClick = () => {
    setIsOpen(false)
    setIsCreateModalOpen(true)
  }

  // Close click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  if (!currentOrgId) return null; // Handled by empty state view instead

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span className="font-medium text-slate-900">{currentOrg?.org_namn || 'Välj verksamhet'}</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
            <div className="px-2 pb-2 border-b border-slate-50 mb-2">
               <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">Verksamheter</span>
            </div>
            {organizations.map((org) => (
              <button
                key={org.org_id}
                onClick={() => handleSelect(org.org_id)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center gap-3
                  ${currentOrgId === org.org_id ? 'bg-slate-50 font-medium text-slate-900' : 'text-slate-600'}
                `}
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                {org.organizations?.org_namn}
              </button>
            ))}
            <div className="border-t border-slate-50 mt-2 pt-2 px-2">
              <button 
                onClick={handleCreateClick}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                  <Plus className="w-4 h-4" />
                  Ny verksamhet
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateOrgModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </>
  )
}

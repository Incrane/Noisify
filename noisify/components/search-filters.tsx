'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, X } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

export default function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentSearch = searchParams.get('q') || ''
  const currentDate = searchParams.get('date') || ''

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`?${params.toString()}`)
  }, 300)

  const handleDate = (date: string) => {
    const params = new URLSearchParams(searchParams)
    if (date) {
      params.set('date', date)
    } else {
      params.delete('date')
    }
    router.replace(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.replace('?')
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Sök efter aktivitet..."
            defaultValue={currentSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="date"
            defaultValue={currentDate}
            onChange={(e) => handleDate(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-600"
          />
        </div>

        {(currentSearch || currentDate) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Rensa
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

export default function SearchInput({ placeholder = "Sök...", className = "" }: { placeholder?: string; className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') || ''

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`?${params.toString()}`)
  }, 300)

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('q')
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        defaultValue={currentSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-12 pr-10 py-3 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      {currentSearch && (
        <button
          onClick={clearSearch}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'

export default function SearchInput({ placeholder = "Sök...", className = "" }: { placeholder?: string; className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [term, setTerm] = useState('')

  useEffect(() => {
    setTerm(searchParams.get('q') || '')
  }, [searchParams])

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    router.replace(`?${params.toString()}`)
  }, 300)

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('q')
    router.replace(`?${params.toString()}`)
    setTerm('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value)
          handleSearch(e.target.value)
        }}
        className="w-full pl-12 pr-10 py-3 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      {term && (
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

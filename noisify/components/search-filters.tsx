'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar as CalendarIcon, X } from 'lucide-react'
import { useDebouncedCallback } from 'use-debounce'
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState, useEffect } from 'react'

import { Badge } from "@/components/ui/badge"

export default function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') || ''
  const currentDateParam = searchParams.get('date')
  const currentCategory = searchParams.get('category')

  const [date, setDate] = useState<Date | undefined>(
    currentDateParam ? new Date(currentDateParam) : undefined
  )

  // Sync state with URL params
  useEffect(() => {
    if (currentDateParam) {
      setDate(new Date(currentDateParam))
    } else {
      setDate(undefined)
    }
  }, [currentDateParam])

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`?${params.toString()}`)
  }, 300)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    const params = new URLSearchParams(searchParams)
    if (selectedDate) {
      // Format as YYYY-MM-DD for the URL
      // Adjust for timezone offset to ensure correct date string
      const offset = selectedDate.getTimezoneOffset()
      const adjustedDate = new Date(selectedDate.getTime() - (offset * 60 * 1000))
      params.set('date', adjustedDate.toISOString().split('T')[0])
    } else {
      params.delete('date')
    }
    router.replace(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setDate(undefined)
    router.replace('?')
  }

  const removeCategory = () => {
    const params = new URLSearchParams(searchParams)
    params.delete('category')
    router.replace(`?${params.toString()}`)
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8">
      <div className="flex flex-col gap-4">
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

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full md:w-[240px] justify-start text-left font-normal h-[42px] border-slate-200",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: sv }) : <span>Välj datum</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        {(currentSearch || date || currentCategory) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aktiva filter:</span>

            {currentCategory && (
              <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                Kategori: {currentCategory}
                <button onClick={removeCategory} className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Ta bort kategori</span>
                </button>
              </Badge>
            )}

            {date && (
              <Badge variant="secondary" className="gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                Datum: {format(date, "d MMM", { locale: sv })}
                <button onClick={() => handleDateSelect(undefined)} className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Ta bort datum</span>
                </button>
              </Badge>
            )}

            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Rensa alla
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

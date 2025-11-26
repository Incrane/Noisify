'use client'

import { useState, useEffect, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MapPin, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface City {
  id: string
  name: string
}

interface CityModalProps {
  cities: City[]
  defaultOpen?: boolean
}

export default function CityModal({ cities, defaultOpen = false }: CityModalProps) {
  const [open, setOpen] = useState(false) // Start false to avoid hydration mismatch
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSelectCity = (city: City) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/city/select', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cityId: city.id,
            cityName: city.name,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to set city')
        }

        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error('Error selecting city:', error)
        // Optionally show error to user
      }
    })
  }

  useEffect(() => {
    if (cities.length === 1 && defaultOpen) {
      // Auto select if only one option
      handleSelectCity(cities[0])
      return
    }

    // Sync with prop on mount
    setOpen(defaultOpen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOpen, cities])

  // If only 1 city, we auto-selected it in useEffect, so don't render dialog to avoid flash (or render empty)
  if (cities.length === 1 && defaultOpen) return null;

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-indigo-600" />
          </div>
          <DialogTitle className="text-center text-xl">Välj din stad</DialogTitle>
          <DialogDescription className="text-center">
            För att visa relevanta aktiviteter behöver vi veta vilken stad du befinner dig i.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {cities.map((city) => (
            <button
              key={city.id}
              onClick={() => handleSelectCity(city)}
              disabled={isPending}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium text-slate-900 group-hover:text-indigo-700">{city.name}</span>
              {isPending ? (
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

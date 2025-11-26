'use client'

import Link from "next/link"
import { useState, useEffect, useTransition } from "react"
import { Menu, MapPin, ChevronDown, Plus, Trash2, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface City {
  id: string
  name: string
}

interface SiteHeaderProps {
  cities?: City[] // All available cities
  selectedCityId?: string
  selectedCityName?: string
  savedCities?: City[] // User's saved cities
  user?: any // Supabase user object
  onSelectCity?: (cityId: string, cityName: string) => Promise<void>
  onSaveCity?: (cityId: string, cityName: string) => Promise<any>
  onRemoveCity?: (cityId: string) => Promise<void>
}

export default function SiteHeader({ 
  cities = [], 
  selectedCityName, 
  selectedCityId, 
  savedCities = [], 
  user,
  onSelectCity,
  onSaveCity,
  onRemoveCity
}: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Fix hydration mismatch by only rendering interactive parts on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCitySelect = (city: City) => {
    if (!onSelectCity) return
    startTransition(async () => {
      await onSelectCity(city.id, city.name)
      setPopoverOpen(false)
      setIsOpen(false)
      router.refresh()
    })
  }

  const handleAddCity = (city: City) => {
    if (!onSaveCity) return
    if (savedCities.length >= 3) {
      alert("Du kan max ha 3 sparade städer.")
      return
    }
    startTransition(async () => {
      await onSaveCity(city.id, city.name)
      setDialogOpen(false)
      router.refresh()
    })
  }

  const handleRemoveCity = (e: React.MouseEvent, cityId: string) => {
    e.stopPropagation()
    if (!onRemoveCity) return
    if (savedCities.length <= 1) {
      alert("Du måste ha minst en stad vald.")
      return
    }
    startTransition(async () => {
      await onRemoveCity(cityId)
      router.refresh()
    })
  }

  // Static trigger buttons for server-side rendering (prevents hydration mismatch)
  const CitySelectorTrigger = (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-sm font-medium text-slate-700 transition-colors border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20" disabled={isPending}>
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
      ) : (
        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
      )}
      <span>{selectedCityName || "Välj stad"}</span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
    </button>
  )

  const MobileMenuTrigger = (
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-6 w-6" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  )

  const availableToAdd = cities.filter(c => !savedCities.some(sc => sc.id === c.id))

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Noisify</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/aktiviteter" className="hover:text-indigo-600 transition-colors">Aktiviteter</Link>
          <Link href="/organisationer" className="hover:text-indigo-600 transition-colors">Fritidsgårdar</Link>
          <Link href="/for-organisationer" className="hover:text-indigo-600 transition-colors">För Organisationer</Link>
        </nav>

        {/* Right: City & Auth */}
        <div className="flex items-center gap-4 shrink-0 ml-auto">
          {/* City Selector (Desktop) */}
          <div className="hidden md:block">
            {isMounted ? (
              <>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    {CitySelectorTrigger}
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[240px] p-0 overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mina städer</p>
                    </div>
                    <div className="p-1">
                      {savedCities.map((city) => (
                        <div
                          key={city.id}
                          className={`group flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 transition-colors ${selectedCityId === city.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'}`}
                        >
                          <button
                            className="flex-1 text-left truncate"
                            onClick={() => handleCitySelect(city)}
                          >
                            {city.name}
                          </button>
                          {savedCities.length > 1 && (
                            <button
                              onClick={(e) => handleRemoveCity(e, city.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition-all"
                              title="Ta bort stad"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {savedCities.length < 3 && (
                      <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                        <button
                          onClick={() => { setPopoverOpen(false); setDialogOpen(true); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Lägg till stad
                        </button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Lägg till stad</DialogTitle>
                      <DialogDescription>
                        Välj en stad att lägga till i din lista. Du kan ha max 3 sparade städer.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-4 max-h-[300px] overflow-y-auto">
                      {availableToAdd.length > 0 ? (
                        availableToAdd.map(city => (
                          <button
                            key={city.id}
                            onClick={() => handleAddCity(city)}
                            className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left"
                          >
                            <span className="font-medium text-slate-900">{city.name}</span>
                            <Plus className="w-4 h-4 text-slate-400" />
                          </button>
                        ))
                      ) : (
                        <p className="text-center text-slate-500 py-4">Inga fler städer tillgängliga.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              CitySelectorTrigger
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link href="/app/aktiviteter" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200">
                Till Appen
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Logga in
                </Link>
                <Link href="/register" className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200">
                  Skapa Gratis Konto
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          {isMounted ? (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                {MobileMenuTrigger}
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                <div className="flex flex-col gap-6 mt-8">
                  <Link href="/" className="flex items-center gap-2 mb-4" onClick={() => setIsOpen(false)}>
                    <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">N</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">Noisify</span>
                  </Link>

                  <nav className="flex flex-col gap-4">
                    <Link href="/aktiviteter" className="text-lg font-medium text-slate-900 hover:text-indigo-600" onClick={() => setIsOpen(false)}>
                      Aktiviteter
                    </Link>
                    <Link href="/organisationer" className="text-lg font-medium text-slate-900 hover:text-indigo-600" onClick={() => setIsOpen(false)}>
                      Fritidsgårdar
                    </Link>
                    <Link href="/for-organisationer" className="text-lg font-medium text-slate-900 hover:text-indigo-600" onClick={() => setIsOpen(false)}>
                      För Organisationer
                    </Link>
                  </nav>

                  <div className="flex flex-col gap-4 mt-auto pt-8 border-t border-slate-100">
                    {/* Mobile City Selector */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-500 mb-2">Mina städer</p>
                      <div className="space-y-2">
                        {savedCities.map((city) => (
                          <div key={city.id} className="flex gap-2">
                            <button
                              onClick={() => { handleCitySelect(city); setIsOpen(false); }}
                              className={`flex-1 px-3 py-2 text-sm rounded-lg border text-left ${selectedCityName === city.name ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700'}`}
                            >
                              {city.name}
                            </button>
                            {savedCities.length > 1 && (
                              <button
                                onClick={(e) => handleRemoveCity(e, city.id)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {savedCities.length < 3 && (
                          <button
                            onClick={() => { setDialogOpen(true); setIsOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
                          >
                            <Plus className="w-4 h-4" /> Lägg till stad
                          </button>
                        )}
                      </div>
                    </div>

                    {user ? (
                      <Link href="/app/aktiviteter" className="w-full py-3 px-4 text-center rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700" onClick={() => setIsOpen(false)}>
                        Till Appen
                      </Link>
                    ) : (
                      <>
                        <Link href="/login" className="w-full py-3 px-4 text-center rounded-lg border border-slate-200 font-medium hover:bg-slate-50" onClick={() => setIsOpen(false)}>
                          Logga in
                        </Link>
                        <Link href="/register" className="w-full py-3 px-4 text-center rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700" onClick={() => setIsOpen(false)}>
                          Skapa Gratis Konto
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            MobileMenuTrigger
          )}
        </div>
      </div>
    </header>
  )
}

'use client'

import { useState } from 'react'
import { updateProfile } from './actions'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EditProfileForm({
  initialAlias,
  initialCityId,
  cities,
}: {
  initialAlias: string
  initialCityId?: string | null
  initialAvatarUrl?: string | null // Kept for prop compatibility but unused
  cities: { id: string; city: string }[]
  avatars: { name: string; url: string }[] // Kept for prop compatibility but unused
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [alias, setAlias] = useState(initialAlias)
  const [cityId, setCityId] = useState(initialCityId || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('alias', alias)
      if (cityId) formData.append('city_id', cityId)

      await updateProfile(formData)
      setIsEditing(false)
    } catch (error) {
      console.error(error)
      alert('Kunde inte uppdatera profil')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="alias" className="text-slate-700 font-semibold">Alias</Label>
            <Input
              id="alias"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="bg-white"
              minLength={3}
              required
              placeholder="Ditt alias"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-slate-700 font-semibold">Stad</Label>
            <div className="relative">
              <select
                id="city"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-0 focus:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="">Välj stad (frivilligt)</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.city}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Spara ändringar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAlias(initialAlias)
              setCityId(initialCityId || '')
              setIsEditing(false)
            }}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          >
            <X className="w-4 h-4 mr-2" />
            Avbryt
          </Button>
        </div>
      </form>
    )
  }

  const cityName = cities.find(c => c.id === initialCityId)?.city

  return (
    <div className="flex items-center justify-between group p-4 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-sm text-slate-500 uppercase tracking-wider font-medium mb-1">Nuvarande uppgifter</span>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900 text-lg">{initialAlias}</span>
            {cityName && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                {cityName}
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        onClick={() => setIsEditing(true)}
        variant="outline"
        className="border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
      >
        <Pencil className="w-4 h-4 mr-2" />
        Ändra uppgifter
      </Button>
    </div>
  )
}

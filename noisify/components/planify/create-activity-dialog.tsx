'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Calendar, Clock, MapPin, Loader2, Tag } from "lucide-react"
import { createActivity, getCategories } from "@/app/planify/[planId]/actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreateActivityDialogProps {
  planId: string
  trigger?: React.ReactNode
}

interface Category {
  id: string
  name: string
  color: string
}

export default function CreateActivityDialog({ planId, trigger }: CreateActivityDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    start_date: "",
    start_time: "09:00",
    end_date: "",
    end_time: "10:00",
    is_all_day: false,
    location: "",
  })

  // Load categories when dialog opens
  useEffect(() => {
    if (open) {
      getCategories(planId).then(({ categories: cats }) => {
        setCategories(cats)
      })

      // Set default dates to today
      const today = new Date().toISOString().split('T')[0]
      setFormData(prev => ({
        ...prev,
        start_date: today,
        end_date: today,
      }))
    }
  }, [open, planId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError("Titel är obligatoriskt")
      return
    }

    if (!formData.start_date || !formData.end_date) {
      setError("Start- och slutdatum är obligatoriskt")
      return
    }

    setIsCreating(true)

    // Combine date and time
    const start_time = formData.is_all_day
      ? `${formData.start_date}T00:00:00`
      : `${formData.start_date}T${formData.start_time}:00`

    const end_time = formData.is_all_day
      ? `${formData.end_date}T23:59:59`
      : `${formData.end_date}T${formData.end_time}:00`

    const { activity, error: createError } = await createActivity({
      plan_id: planId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      category_id: formData.category_id || undefined,
      start_time,
      end_time,
      is_all_day: formData.is_all_day,
      location: formData.location.trim() || undefined,
    })

    if (createError) {
      setError(createError)
      setIsCreating(false)
      return
    }

    setIsCreating(false)
    setOpen(false)
    resetForm()
    router.refresh()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category_id: "",
      start_date: "",
      start_time: "09:00",
      end_date: "",
      end_time: "10:00",
      is_all_day: false,
      location: "",
    })
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ny aktivitet
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              Skapa aktivitet
            </DialogTitle>
            <DialogDescription>
              Lägg till en ny aktivitet i planen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="t.ex. Fotbollsträning"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                autoFocus
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* All day checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_all_day"
                checked={formData.is_all_day}
                onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="is_all_day" className="font-normal cursor-pointer">
                Heldag
              </Label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Startdatum *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      start_date: e.target.value,
                      end_date: formData.end_date < e.target.value ? e.target.value : formData.end_date
                    })
                  }}
                />
              </div>
              {!formData.is_all_day && (
                <div className="space-y-2">
                  <Label htmlFor="start_time">Starttid *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end_date">Slutdatum *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  min={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              {!formData.is_all_day && (
                <div className="space-y-2">
                  <Label htmlFor="end_time">Sluttid *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Plats</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="location"
                  placeholder="t.ex. Stora salen"
                  className="pl-10"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                placeholder="Lägg till en beskrivning..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skapar...
                </>
              ) : (
                "Skapa aktivitet"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

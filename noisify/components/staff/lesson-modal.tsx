'use client'

import { useState, useEffect } from 'react'
import { X, Clock } from 'lucide-react'

interface LessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (lesson: { title: string, duration_minutes: number, start_at?: string, end_at?: string }) => void
  initialData?: { title: string, duration_minutes: number, start_at?: string, end_at?: string }
}

export default function LessonModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: LessonModalProps) {
  const [title, setTitle] = useState('')
  const [timeStr, setTimeStr] = useState('00:10') // Default 10 min
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title)
        const h = Math.floor(initialData.duration_minutes / 60)
        const m = initialData.duration_minutes % 60
        setTimeStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
        setStartAt(initialData.start_at ? new Date(initialData.start_at).toISOString().slice(0, 16) : '')
        setEndAt(initialData.end_at ? new Date(initialData.end_at).toISOString().slice(0, 16) : '')
      } else {
        setTitle('')
        setTimeStr('00:10')
        setStartAt('')
        setEndAt('')
      }
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const [hours, minutes] = timeStr.split(':').map(Number)
  const totalMinutes = (hours || 0) * 60 + (minutes || 0)
  
  let durationText = ''
  if (totalMinutes === 0) {
      durationText = '0 minuter'
  } else {
      const h = Math.floor(totalMinutes / 60)
      const m = totalMinutes % 60
      if (h > 0) durationText += `${h} timma${h > 1 ? 'r' : ''} `
      if (m > 0) {
          if (h > 0) durationText += 'och '
          durationText += `${m} minut${m !== 1 ? 'er' : ''}`
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (!title.trim()) return
      
      onSave({
          title,
          duration_minutes: totalMinutes,
          start_at: startAt || undefined,
          end_at: endAt || undefined
      })
      onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Lektion</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Titel</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Lektionens titel..."
                    autoFocus
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Startdatum & tid</label>
                    <input 
                        type="datetime-local" 
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Slutdatum & tid</label>
                    <input 
                        type="datetime-local" 
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Varaktighet</label>
                <div className="relative">
                    <input 
                        type="time" 
                        value={timeStr}
                        onChange={(e) => setTimeStr(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    OBS: Lektionen kommer att ta {durationText}.
                </p>
            </div>

            <div className="flex justify-end pt-2">
                <button 
                    type="submit"
                    className="px-6 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                >
                    Spara
                </button>
            </div>
        </form>
      </div>
    </div>
  )
}

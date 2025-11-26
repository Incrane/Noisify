'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface TagModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (tagName: string) => Promise<void>
}

export default function TagModal({
  isOpen,
  onClose,
  onCreate
}: TagModalProps) {
  const [tagName, setTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!tagName.trim()) return
      
      setIsCreating(true)
      await onCreate(tagName)
      setIsCreating(false)
      setTagName('')
      onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Ny tagg</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Taggar</label>
                <input 
                    type="text" 
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Namn på tagg..."
                    autoFocus
                />
            </div>

            <div className="flex justify-end">
                <button 
                    type="submit"
                    disabled={isCreating || !tagName.trim()}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {isCreating ? 'Skapar...' : 'Skapa ny tagg'}
                </button>
            </div>
        </form>
      </div>
    </div>
  )
}

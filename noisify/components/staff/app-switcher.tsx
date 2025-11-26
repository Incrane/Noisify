'use client'

import { useState, useRef, useEffect } from 'react'
import { Grid, Calendar, Layout } from 'lucide-react'

export default function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
      >
        <Grid className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 p-4 z-50">
          <h3 className="text-sm font-medium text-slate-500 mb-3 px-1">Applikationer</h3>
          <div className="grid gap-2">
              <button className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <Layout className="w-6 h-6" />
                  </div>
                  <div>
                      <div className="font-bold text-slate-900">Noisify</div>
                      <div className="text-xs text-slate-500">Publicera och dela aktiviteter</div>
                  </div>
              </button>
              <button className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                      <div className="font-bold text-slate-900">Planify</div>
                      <div className="text-xs text-slate-500">Planera aktiviteter i din verksamhet</div>
                  </div>
              </button>
          </div>
        </div>
      )}
    </div>
  )
}

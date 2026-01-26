'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Grid, Calendar, Layout, Check } from 'lucide-react'

const apps = [
  {
    id: 'noisify',
    name: 'Noisify',
    description: 'Publicera och dela aktiviteter',
    href: '/staff',
    icon: Layout,
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    hoverBg: 'group-hover:bg-indigo-200',
    pathPrefix: '/staff'
  },
  {
    id: 'planify',
    name: 'Planify',
    description: 'Planera aktiviteter i din verksamhet',
    href: '/planify',
    icon: Calendar,
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    hoverBg: 'group-hover:bg-orange-200',
    pathPrefix: '/planify'
  }
]

export default function AppSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Determine current app
  const currentApp = apps.find(app => pathname.startsWith(app.pathPrefix))?.id || 'noisify'

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
        aria-label="Switch application"
      >
        <Grid className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 p-4 z-50">
          <h3 className="text-sm font-medium text-slate-500 mb-3 px-1">Applikationer</h3>
          <div className="grid gap-2">
            {apps.map((app) => {
              const Icon = app.icon
              const isActive = currentApp === app.id

              return (
                <Link
                  key={app.id}
                  href={app.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-left group relative ${
                    isActive ? 'bg-slate-50 ring-1 ring-slate-200' : ''
                  }`}
                >
                  <div className={`p-2 ${app.bgColor} ${app.textColor} rounded-lg ${app.hoverBg} transition-colors`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      {app.name}
                      {isActive && (
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Aktiv
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{app.description}</div>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 text-green-600 absolute top-3 right-3" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

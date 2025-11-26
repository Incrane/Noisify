'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { User, LogOut, LayoutDashboard } from 'lucide-react'
import { signOut } from '@/app/login/actions'

interface UserDropdownProps {
    userEmail: string
    userAlias?: string
    userAvatar?: string | null
    isStaff?: boolean
}

export default function UserDropdown({ userEmail, userAlias, userAvatar, isStaff = false }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm hover:ring-2 hover:ring-indigo-100 transition-all overflow-hidden"
            >
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={userAlias || 'User'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    userAlias?.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <p className="font-medium text-slate-900 truncate">
                            {userAlias || 'Användare'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                    </div>

                    <div className="p-1">
                        <Link
                            href="/app/profil"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                        >
                            <User className="w-4 h-4" />
                            Min profil
                        </Link>
                        
                        {isStaff && (
                            <Link
                                href="/staff"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>
                        )}
                    </div>

                    <div className="p-1 border-t border-slate-50">
                        <form action={signOut}>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <LogOut className="w-4 h-4" />
                                Logga ut
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

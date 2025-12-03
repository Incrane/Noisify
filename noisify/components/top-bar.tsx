'use client'

import { useState, useEffect } from 'react'
import SearchInput from './search-input'
import NotificationsDropdown from './notifications-dropdown'
import UserDropdown from './user-dropdown'

interface TopBarProps {
    userEmail: string
    userAlias?: string
    userAvatar?: string | null
    isStaff?: boolean
}

export default function TopBar({ userEmail, userAlias, userAvatar, isStaff = false }: TopBarProps) {
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Format date in Swedish
    const today = new Date()
    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    }
    const dateString = today.toLocaleDateString('sv-SE', dateOptions)
    // Capitalize first letter of weekday
    const formattedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1)

    return (
        <div className={`fixed top-0 left-0 md:left-64 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm py-2' : 'bg-transparent py-6'}`}>
            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">

                {/* Left Side - Greeting (Collapses on scroll) */}
                <div className={`transition-all duration-300 overflow-hidden ${isScrolled ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                    <div className="whitespace-nowrap">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Hej {userAlias || 'Användare'}!
                        </h1>
                        <p className="text-sm text-slate-500">
                            Idag är det {formattedDate}
                        </p>
                    </div>
                </div>

                {/* Right Side - Actions */}
                <div className={`flex items-center gap-4 transition-all duration-300 ${isScrolled ? 'w-full justify-between' : 'justify-end flex-1'}`}>
                    {/* Search Input - Expands when scrolled */}
                    <div className={`transition-all duration-300 ${isScrolled ? 'flex-1 max-w-md' : 'w-64'}`}>
                        <SearchInput placeholder="Sök aktiviteter..." />
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationsDropdown />
                        <UserDropdown userEmail={userEmail} userAlias={userAlias} userAvatar={userAvatar} isStaff={isStaff} />
                    </div>
                </div>

            </div>
        </div>
    )
}

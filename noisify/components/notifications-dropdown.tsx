'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { markAsRead, markAllAsRead } from '@/app/actions/notifications'
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    message: string
    is_viewed: boolean
    created_at: string
    action_url?: string
    type: string
}

export default function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/app/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
                setUnreadCount(data.filter((n: Notification) => !n.is_viewed).length)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_viewed) {
            try {
                await markAsRead(notification.id)
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_viewed: true } : n)
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            } catch (error) {
                console.error('Error marking as read', error)
            }
        }
        setIsOpen(false)
    }

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, is_viewed: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Error marking all as read', error)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                    <div className="p-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-semibold text-sm text-slate-900">Notiser</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Markera alla som lästa
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Inga notiser just nu
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-slate-50 transition-colors ${!notification.is_viewed ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <div
                                            onClick={() => !notification.action_url && handleNotificationClick(notification)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className={`text-sm ${!notification.is_viewed ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.is_viewed && (
                                                    <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                </span>
                                                {notification.action_url && (
                                                    <Link
                                                        href={notification.action_url}
                                                        onClick={() => handleNotificationClick(notification)}
                                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                                    >
                                                        Visa
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

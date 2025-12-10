'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Trash2, Maximize2 } from 'lucide-react'
import { markAsRead, markAllAsRead, clearAllNotifications } from '@/app/actions/notifications'
import Link from 'next/link'
import AllNotificationsModal from './all-notifications-modal'
import { createClient } from '@/utils/supabase/client'

interface Notification {
    id: string
    title: string
    message: string
    is_viewed: boolean
    created_at: string
    action_url?: string
    type: string
}

interface NotificationsDropdownProps {
    userId?: string
}

export default function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [confirmClear, setConfirmClear] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [showAllModal, setShowAllModal] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    setNotifications(data)
                    setUnreadCount(data.filter((n: Notification) => !n.is_viewed).length)
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        }
    }

    useEffect(() => {
        fetchNotifications()

        if (!userId) return

        const channel = supabase
            .channel(`notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events
                    schema: 'public',
                    table: 'notifications',
                    filter: `assigned_user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification
                        setNotifications(prev => [newNotification, ...prev])
                        if (!newNotification.is_viewed) {
                            setUnreadCount(prev => prev + 1)
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedNotification = payload.new as Notification
                        setNotifications(prev => prev.map(n => n.id === updatedNotification.id ? updatedNotification : n))
                        // Recalculate unread count based on current state + update
                        // (Ideally we re-calc from full list, or check is_viewed transition)
                        if (payload.old && (payload.old as any).is_viewed === false && updatedNotification.is_viewed === true) {
                            setUnreadCount(prev => Math.max(0, prev - 1))
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id
                        setNotifications(prev => {
                            const exists = prev.find(n => n.id === deletedId)
                            if (exists && !exists.is_viewed) {
                                setUnreadCount(curr => Math.max(0, curr - 1))
                            }
                            return prev.filter(n => n.id !== deletedId)
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setConfirmClear(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (confirmClear) {
            const timeout = setTimeout(() => setConfirmClear(false), 3000)
            return () => clearTimeout(timeout)
        }
    }, [confirmClear])

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_viewed) {
            try {
                await markAsRead(notification.id)
                // Optimistic update handled by realtime subscription usually, 
                // but direct action provides faster feedback.
                // However, conflicts might occur if realtime event arrives same time.
                // We'll keep local update for immediate feedback.
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

    const handleClearAll = async () => {
        if (!confirmClear) {
            setConfirmClear(true)
            return
        }

        try {
            await clearAllNotifications()
            setNotifications([])
            setUnreadCount(0)
            setConfirmClear(false)
        } catch (error) {
            console.error('Error clearing all notifications', error)
        }
    }

    return (
        <>
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
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Läs alla
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className={`text-xs font-medium transition-colors flex items-center gap-1 ${confirmClear
                                            ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md'
                                            : 'text-red-500 hover:text-red-600'
                                            }`}
                                        title={confirmClear ? "Bekräfta rensning" : "Rensa alla"}
                                    >
                                        {confirmClear ? (
                                            <span>Bekräfta?</span>
                                        ) : (
                                            <span>Rensa</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    Inga notiser just nu
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.slice(0, 5).map((notification) => (
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
                                                        {/* {new Date(notification.created_at).toLocaleDateString()} */}
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

                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-slate-50 bg-slate-50/30">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        setShowAllModal(true)
                                    }}
                                    className="w-full py-2 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {/* <Maximize2 className="w-3.5 h-3.5" /> */}
                                    Visa alla notiser ({notifications.length})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AllNotificationsModal
                isOpen={showAllModal}
                onClose={() => setShowAllModal(false)}
                onNotificationsChange={fetchNotifications}
            />
        </>
    )
}

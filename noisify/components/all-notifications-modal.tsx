'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, CheckCircle2, Bell } from 'lucide-react'
import { markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } from '@/app/actions/notifications'
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

interface AllNotificationsModalProps {
    isOpen: boolean
    onClose: () => void
    onNotificationsChange: () => void
}

export default function AllNotificationsModal({ isOpen, onClose, onNotificationsChange }: AllNotificationsModalProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen])

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_viewed: true } : n)
            )
            onNotificationsChange()
        } catch (error) {
            console.error('Error marking as read', error)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteNotification(id)
            setNotifications(prev => prev.filter(n => n.id !== id))
            onNotificationsChange()
        } catch (error) {
            console.error('Error deleting notification', error)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, is_viewed: true })))
            onNotificationsChange()
        } catch (error) {
            console.error('Error marking all as read', error)
        }
    }

    const handleClearAll = async () => {
        if (!confirm('Är du säker på att du vill radera alla notiser?')) return

        try {
            await clearAllNotifications()
            setNotifications([])
            onNotificationsChange()
        } catch (error) {
            console.error('Error clearing all notifications', error)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-bold text-lg text-slate-900">Alla notiser</h2>
                        <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
                            {notifications.length}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                {notifications.length > 0 && (
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-end gap-2 bg-white">
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Markera alla som lästa
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Rensa alla
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Laddar notiser...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                <Bell className="w-6 h-6" />
                            </div>
                            <p>Inga notiser att visa</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`group relative bg-white rounded-xl p-4 border transition-all hover:shadow-md ${!notification.is_viewed
                                        ? 'border-indigo-100 shadow-sm'
                                        : 'border-slate-100 opacity-90 hover:opacity-100'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_viewed ? 'bg-indigo-500' : 'bg-slate-200'
                                        }`} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className={`text-sm ${!notification.is_viewed ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(notification.created_at).toLocaleString('sv-SE', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-600 mt-1 mb-3 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center gap-3">
                                            {notification.action_url && (
                                                <Link
                                                    href={notification.action_url}
                                                    onClick={() => {
                                                        if (!notification.is_viewed) handleMarkAsRead(notification.id)
                                                        onClose()
                                                    }}
                                                    className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    Visa
                                                </Link>
                                            )}
                                            {!notification.is_viewed && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                                >
                                                    Markera som läst
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(notification.id)}
                                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Radera notis"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

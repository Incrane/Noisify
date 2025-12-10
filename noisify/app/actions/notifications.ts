'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAsRead(notificationId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .update({ is_viewed: true })
        .eq('id', notificationId)
        .eq('assigned_user_id', user.id)

    if (error) {
        console.error('Error marking notification as read:', error)
        throw new Error('Could not mark notification as read')
    }

    revalidatePath('/app')
}

export async function markAllAsRead() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .update({ is_viewed: true })
        .eq('assigned_user_id', user.id)
        .eq('is_viewed', false)

    if (error) {
        console.error('Error marking all notifications as read:', error)
        throw new Error('Could not mark all notifications as read')
    }

    revalidatePath('/app')
}

export async function deleteNotification(notificationId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('assigned_user_id', user.id)

    if (error) {
        console.error('Error deleting notification:', error)
        throw new Error('Could not delete notification')
    }

    revalidatePath('/app')
}

export async function clearAllNotifications() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('assigned_user_id', user.id)

    if (error) {
        console.error('Error clearing all notifications:', error)
        throw new Error('Could not clear all notifications')
    }

    revalidatePath('/app')
}

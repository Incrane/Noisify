import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('assigned_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching notifications:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }

    return NextResponse.json(notifications)
}

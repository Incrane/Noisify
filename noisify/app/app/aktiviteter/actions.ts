'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function registerForActivity(activityId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get profile id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Check if already registered
  const { data: existing } = await supabase
    .from('registration')
    .select('*')
    .eq('activity_id', activityId)
    .eq('profile_id', profile.id)
    .single()

  if (existing) {
    // return { message: 'Du är redan anmäld' }
    return
  }

  // Insert registration
  // Default to PENDING. 
  // Note: Real-time logic or database triggers might handle waitlist logic, 
  // but we just insert here.
  const { error } = await supabase
    .from('registration')
    .insert({
      activity_id: activityId,
      profile_id: profile.id
    })

  if (error) {
    console.error('Registration error:', error)
    redirect(`/app/aktiviteter/${activityId}?error=${encodeURIComponent('Kunde inte anmäla dig: ' + error.message)}`)
  }

  revalidatePath(`/app/aktiviteter/${activityId}`)
  revalidatePath('/app/aktiviteter')
}

export async function unregisterFromActivity(activityId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase
    .from('registration')
    .delete()
    .eq('activity_id', activityId)
    .eq('profile_id', profile.id)

  if (error) {
    console.error('Unregister error:', error)
    throw new Error('Kunde inte avanmäla dig')
  }

  revalidatePath(`/app/aktiviteter/${activityId}`)
  revalidatePath('/app/aktiviteter')
}

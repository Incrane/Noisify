'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Get data from form
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error, data: { user } } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=Could not authenticate user')
  }

  if (user) {
    // Check if user is staff (has role_id >= 1 in any organization)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      const { data: orgUser } = await supabase
        .from('org_user')
        .select('role_id')
        .eq('profile_id', profile.id)
        .gte('role_id', 1)
        .limit(1)
      
      if (orgUser && orgUser.length > 0) {
        revalidatePath('/', 'layout')
        redirect('/staff')
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/app/aktiviteter')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Get data from form
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  // Note: Additional fields like birth year and alias would need to be handled here 
  // or in a subsequent profile completion step. 
  // For now we stick to basic auth signup.

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check email to continue sign in process')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

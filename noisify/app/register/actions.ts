'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function register(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const alias = formData.get('alias') as string
  const birthDate = formData.get('birthDate') as string
  const gdpr = formData.get('gdpr')

  // Validation
  if (!email || !password || !alias || !birthDate) {
    return redirect('/register?error=Alla fält måste fyllas i')
  }

  if (!gdpr) {
    return redirect('/register?error=Du måste godkänna villkoren')
  }

  const birthYear = new Date(birthDate).getFullYear()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        alias,
        fodd_ar: birthYear,
        birth_date: birthDate,
      },
    },
  })

  if (error) {
    return redirect(`/register?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Ett verifieringsmail har skickats. Vänligen bekräfta din e-postadress för att logga in.')
}

'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAccount(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const phone = formData.get('phone') as string

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                phone: phone,
            },
        },
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Kunde inte skapa användare' }
    }

    // 2. Create profile (upsert to be safe against trigger race/failure)
    const alias = `${firstName} ${lastName}`.trim()
    // Default city_id for Göteborg (temporary fix)
    const DEFAULT_CITY_ID = 'c44816cf-6e88-45a5-a8b1-5a3b595210de'

    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            user_id: authData.user.id,
            alias: alias,
            city_id: DEFAULT_CITY_ID
        }, { onConflict: 'user_id' })

    if (profileError) {
        console.error('Error updating profile:', profileError)
        // Continue anyway, not critical
    }

    return { success: true, userId: authData.user.id }
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Inte inloggad' }
    }

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    // Add other profile fields if needed

    const alias = `${firstName} ${lastName}`.trim()

    const { error } = await supabase
        .from('profiles')
        .update({ alias })
        .eq('user_id', user.id)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function createOrganization(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Inte inloggad' }
    }

    const orgName = formData.get('orgName') as string
    const orgAddress = formData.get('orgAddress') as string
    const contactEmail = formData.get('contactEmail') as string
    const contactPhone = formData.get('contactPhone') as string

    // Default city_id for Göteborg (temporary fix as city picker is missing)
    const DEFAULT_CITY_ID = 'c44816cf-6e88-45a5-a8b1-5a3b595210de'

    const { data: orgId, error: rpcError } = await supabase.rpc('create_new_organization', {
        p_org_name: orgName,
        p_org_address: orgAddress,
        p_contact_email: contactEmail,
        p_contact_phone: contactPhone,
        p_city_id: DEFAULT_CITY_ID
    })

    if (rpcError) {
        console.error('Error creating org via RPC:', rpcError)
        return { error: 'Kunde inte skapa organisation: ' + rpcError.message }
    }

    revalidatePath('/staff')
    return { success: true, orgId: orgId }
}

export async function uploadOrgLogo(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Inte inloggad" }

    const file = formData.get("file") as File;
    if (!file) return { error: "Ingen fil vald" };

    // Validate file type
    if (!file.type.startsWith("image/")) {
        return { error: "Endast bilder är tillåtna (JPG, PNG, WEBP)" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return { error: "Filen är för stor. Maxstorlek är 5MB." };
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `org-logo_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("public_images")
        .upload(filePath, file);

    if (uploadError) {
        return { error: "Kunde inte ladda upp logotyp: " + uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("public_images")
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}

export async function completeOnboarding(orgId: string, data: {
    description?: string;
    logo_url?: string;
    opening_hours?: any;
    social_links?: any;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Inte inloggad" }

    // Verify user is admin of this org
    const { data: membership } = await supabase
        .from('org_user')
        .select('role_id')
        .eq('profile_id', (await supabase.from('profiles').select('id').eq('user_id', user.id).single()).data?.id)
        .eq('org_id', orgId)
        .single()

    if (!membership || membership.role_id < 4) {
        return { error: "Du har inte behörighet att redigera denna organisation" }
    }

    const { error } = await supabase
        .from('organizations')
        .update({
            description: data.description,
            logo_url: data.logo_url,
            opening_hours: data.opening_hours,
            social_links: data.social_links,
            // We could set status to 'active' here if we wanted auto-approval, 
            // but for now we keep it pending or whatever it was.
            // Actually, let's assume this completes the setup so maybe we mark it as 'active' if it was 'pending'?
            // Or just leave it as is. The requirement says "New organizations require admin approval".
            // So we leave it as is.
        })
        .eq('id', orgId)

    if (error) {
        console.error('Complete onboarding error:', error)
        return { error: "Kunde inte spara uppgifter: " + error.message }
    }

    revalidatePath('/staff')
    return { success: true }
}

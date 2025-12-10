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
    const cityId = formData.get('cityId') as string

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

    // 2. Create profile
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            user_id: authData.user.id,
            alias: 'random alias', // Will be updated in next step
            city_id: cityId,
            image_url: null,
            account_type: 'digital',
            is_verified: false,
            account_sort: 'business'
        })

    if (profileError) {
        console.error('Error creating profile:', profileError)
        return { error: 'Kunde inte skapa profil: ' + profileError.message }
    }

    // 3. Create private user data
    // First get the profile id
    const { data: profileData, error: fetchProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

    if (fetchProfileError || !profileData) {
        console.error('Error fetching profile:', fetchProfileError)
        return { error: 'Kunde inte hämta profil' }
    }

    const { error: privateError } = await supabase
        .from('users_private')
        .insert({
            user_id: authData.user.id,
            profile_id: profileData.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone_number: phone
        })

    if (privateError) {
        console.error('Error creating private data:', privateError)
        // This is critical, so we should probably return error
        return { error: 'Kunde inte spara privat data: ' + privateError.message }
    }

    return { success: true, userId: authData.user.id }
}

export async function getCities() {
    const supabase = await createClient()
    const { data } = await supabase.from('cities').select('id, city').order('city')
    return data || []
}

export async function uploadUserAvatar(formData: FormData) {
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
    const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `staff_avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("public_images")
        .upload(filePath, file);

    if (uploadError) {
        return { error: "Kunde inte ladda upp bild: " + uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
        .from("public_images")
        .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Inte inloggad' }
    }

    const alias = formData.get('alias') as string
    const imageUrl = formData.get('imageUrl') as string

    const { error } = await supabase
        .from('profiles')
        .update({
            alias: alias,
            image_url: imageUrl
        })
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
    const role = formData.get('role') as string

    // Get the user's profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, city_id')
        .eq('user_id', user.id)
        .single()

    const cityId = profile?.city_id || 'c44816cf-6e88-45a5-a8b1-5a3b595210de' // Fallback
    const profileId = profile?.id

    if (!profileId) {
        return { error: 'Kunde inte hitta din profil' }
    }

    // Create slug
    const slug = orgName.toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/[ö]/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4)

    // 1. Create Organization
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
            org_namn: orgName,
            city_id: cityId,
            adress: orgAddress,
            kontakt: { epost: contactEmail, phonenumber: contactPhone },
            slug: slug,
            org_status: 'pending',
            tier: 'FREE',
            max_members: 50,
            max_staff: 100,
            max_storage_mb: 500,
            contact_email: contactEmail,
            contact_phone: contactPhone
        })
        .select('id')
        .single()

    if (orgError) {
        console.error('Error creating org:', orgError)
        return { error: 'Kunde inte skapa organisation: ' + orgError.message }
    }

    // 2. Create Org User Link
    const { error: linkError } = await supabase
        .from('org_user')
        .insert({
            org_id: org.id,
            role_id: 3,
            profile_id: profileId,
            user_id: user.id,
            verksamhets_roll: role,
            status: 'onboarding'
        })

    if (linkError) {
        console.error('Error creating org user link:', linkError)
        // Rollback org creation if possible, or just report error. 
        // For now, report error.
        return { error: 'Kunde inte koppla dig till organisationen: ' + linkError.message }
    }

    revalidatePath('/staff')
    return { success: true, orgId: org.id }
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
        })
        .eq('id', orgId)

    if (error) {
        console.error('Complete onboarding error:', error)
        return { error: "Kunde inte spara uppgifter: " + error.message }
    }

    revalidatePath('/staff')
    return { success: true }
}

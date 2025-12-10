"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type FavoriteType = 'activity' | 'course' | 'organization';

export async function updateNotificationSettings(settings: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    throw new Error("Profile not found");
  }

  const { error } = await supabase
    .from("user_settings")
    .upsert({
      profile_id: profile.id,
      notification_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  revalidatePath("/app/profil/notiser");
}

export async function updateProfile(formData: FormData) {
  const alias = formData.get('alias') as string;
  const cityId = formData.get('city_id') ? parseInt(formData.get('city_id') as string) : null;
  const avatarUrl = formData.get('avatar_url') as string;

  if (!alias) {
    throw new Error("Alias is required");
  }

  await updateUserProfile({ alias, city_id: cityId || undefined, image_url: avatarUrl || undefined });
}

export async function updateUserProfile(data: {
  alias?: string;
  city_id?: number;
  image_url?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  revalidatePath("/app/profil/konto");
}

export async function searchEntities(type: FavoriteType, query: string) {
  const supabase = await createClient();
  let table = '';
  let select = 'id, name'; // Assuming common columns, adjust as needed

  switch (type) {
    case 'activity':
      table = 'activity_dashboard'; // Using view for searching
      select = 'activity_id as id, aktivitet as name, image_url';
      break;
    case 'course':
      table = 'courses'; // Assuming table name
      select = 'id, title as name, image_url'; // Adjust column names
      break;
    case 'organization':
      table = 'organisation';
      select = 'org_id as id, name, logo_url as image_url';
      break;
  }

  if (!table) return [];

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .ilike('name', `%${query}%`) // Adjust 'name' column if different
    .limit(5);

  if (error) {
    console.error(`Error searching ${type}:`, error);
    return [];
  }

  return data || [];
}

export async function addFavorite(type: FavoriteType, id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  let table = '';
  let column = '';

  switch (type) {
    case 'activity':
      table = 'activity_favorites';
      column = 'activity_id';
      break;
    case 'course':
      table = 'course_favorites';
      column = 'course_id';
      break;
    case 'organization':
      table = 'organization_favorites';
      column = 'org_id';
      break;
  }

  const { error } = await supabase
    .from(table)
    .insert({
      profile_id: profile.id,
      [column]: id
    });

  if (error) throw new Error(`Failed to add favorite: ${error.message}`);
  revalidatePath("/app/profil");
  revalidatePath("/app/aktiviteter");
  revalidatePath("/app/profil/favoriter");
}

export async function removeFavorite(type: FavoriteType, id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  let table = '';
  let column = '';

  switch (type) {
    case 'activity':
      table = 'activity_favorites';
      column = 'activity_id';
      break;
    case 'course':
      table = 'course_favorites';
      column = 'course_id';
      break;
    case 'organization':
      table = 'organization_favorites';
      column = 'org_id';
      break;
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('profile_id', profile.id)
    .eq(column, id);

  if (error) throw new Error(`Failed to remove favorite: ${error.message}`);
  revalidatePath("/app/profil");
  revalidatePath("/app/aktiviteter");
  revalidatePath("/app/profil/favoriter");
}

/**
 * Update alias after being forced to change it by staff
 * This validates the new alias, updates the profile, and clears the requires_alias_change flag
 */
export async function updateAliasAfterForce(profileId: string, newAlias: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Ej autentiserad' };
  }

  // Verify the user owns this profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('id', profileId)
    .single();

  if (!profile || profile.user_id !== user.id) {
    return { error: 'Ogiltig profil' };
  }

  // Validate alias length
  if (newAlias.length < 3 || newAlias.length > 50) {
    return { error: 'Alias måste vara mellan 3 och 50 tecken' };
  }

  // Check if alias is banned
  const { data: bannedAlias } = await supabase
    .from('blocked_alias')
    .select('id')
    .ilike('alias', newAlias)
    .single();

  if (bannedAlias) {
    return { error: 'Detta alias är inte tillgängligt' };
  }

  // Check if alias is taken by another user
  const { data: existingAlias } = await supabase
    .from('profiles')
    .select('id')
    .ilike('alias', newAlias)
    .neq('id', profileId)
    .single();

  if (existingAlias) {
    return { error: 'Detta alias används redan av någon annan' };
  }

  // Update the profile with new alias and clear the requires_alias_change flag
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      alias: newAlias,
      requires_alias_change: false
    })
    .eq('id', profileId);

  if (updateError) {
    console.error('Error updating alias:', updateError);
    return { error: 'Kunde inte uppdatera alias' };
  }

  revalidatePath('/app');
  return { success: true };
}

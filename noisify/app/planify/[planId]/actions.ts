'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

// Types
export interface Activity {
  id: string
  plan_id: string
  title: string
  description: string | null
  category_id: string | null
  start_time: string
  end_time: string
  is_all_day: boolean
  location: string | null
  status: 'draft' | 'ready' | 'published'
  noisify_activity_id: string | null
  synced_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined data
  category?: {
    id: string
    name: string
    color: string
  }
}

export interface CreateActivityInput {
  plan_id: string
  title: string
  description?: string
  category_id?: string
  start_time: string
  end_time: string
  is_all_day?: boolean
  location?: string
}

export interface UpdateActivityInput {
  title?: string
  description?: string
  category_id?: string | null
  start_time?: string
  end_time?: string
  is_all_day?: boolean
  location?: string
  status?: 'draft' | 'ready' | 'published'
}

// Get the user's profile
async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, alias")
    .eq("user_id", user.id)
    .single()

  return profile
}

// Get all activities for a plan
export async function getActivities(planId: string): Promise<{ activities: Activity[], error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { activities: [], error: "Unauthorized" }
  }

  const { data: activities, error } = await supabase
    .from("p_activities")
    .select(`
      *,
      category:p_categories(id, name, color)
    `)
    .eq("plan_id", planId)
    .order("start_time", { ascending: true })

  if (error) {
    console.error("Error fetching activities:", error)
    return { activities: [], error: error.message }
  }

  return { activities: activities || [], error: null }
}

// Get a single activity
export async function getActivity(activityId: string): Promise<{ activity: Activity | null, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { activity: null, error: "Unauthorized" }
  }

  const { data: activity, error } = await supabase
    .from("p_activities")
    .select(`
      *,
      category:p_categories(id, name, color)
    `)
    .eq("id", activityId)
    .single()

  if (error) {
    return { activity: null, error: error.message }
  }

  return { activity, error: null }
}

// Create a new activity
export async function createActivity(input: CreateActivityInput): Promise<{ activity: Activity | null, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { activity: null, error: "Unauthorized" }
  }

  const { data: activity, error } = await supabase
    .from("p_activities")
    .insert({
      plan_id: input.plan_id,
      title: input.title,
      description: input.description || null,
      category_id: input.category_id || null,
      start_time: input.start_time,
      end_time: input.end_time,
      is_all_day: input.is_all_day || false,
      location: input.location || null,
      created_by: profile.id,
      status: 'draft'
    })
    .select(`
      *,
      category:p_categories(id, name, color)
    `)
    .single()

  if (error) {
    console.error("Error creating activity:", error)
    return { activity: null, error: error.message }
  }

  revalidatePath(`/planify/${input.plan_id}`)
  return { activity, error: null }
}

// Update an activity
export async function updateActivity(
  activityId: string,
  input: UpdateActivityInput
): Promise<{ success: boolean, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { success: false, error: "Unauthorized" }
  }

  // Get the activity to find the plan_id for revalidation
  const { data: existingActivity } = await supabase
    .from("p_activities")
    .select("plan_id")
    .eq("id", activityId)
    .single()

  const { error } = await supabase
    .from("p_activities")
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq("id", activityId)

  if (error) {
    console.error("Error updating activity:", error)
    return { success: false, error: error.message }
  }

  if (existingActivity) {
    revalidatePath(`/planify/${existingActivity.plan_id}`)
  }
  return { success: true, error: null }
}

// Delete an activity
export async function deleteActivity(activityId: string): Promise<{ success: boolean, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { success: false, error: "Unauthorized" }
  }

  // Get the activity to find the plan_id for revalidation
  const { data: existingActivity } = await supabase
    .from("p_activities")
    .select("plan_id")
    .eq("id", activityId)
    .single()

  const { error } = await supabase
    .from("p_activities")
    .delete()
    .eq("id", activityId)

  if (error) {
    console.error("Error deleting activity:", error)
    return { success: false, error: error.message }
  }

  if (existingActivity) {
    revalidatePath(`/planify/${existingActivity.plan_id}`)
  }
  return { success: true, error: null }
}

// Get categories for a plan's organization
export async function getCategories(planId: string): Promise<{ categories: { id: string, name: string, color: string }[], error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { categories: [], error: "Unauthorized" }
  }

  // Get the plan's org_id
  const { data: plan } = await supabase
    .from("p_plans")
    .select("org_id")
    .eq("id", planId)
    .single()

  if (!plan) {
    return { categories: [], error: "Plan not found" }
  }

  // Get default categories and org-specific categories
  const { data: categories, error } = await supabase
    .from("p_categories")
    .select("id, name, color")
    .or(`is_default.eq.true,org_id.eq.${plan.org_id}`)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return { categories: [], error: error.message }
  }

  return { categories: categories || [], error: null }
}

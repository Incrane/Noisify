'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { getSelectedOrganization } from "@/app/staff/actions"

// Types
export interface Plan {
  id: string
  org_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  start_date: string | null
  end_date: string | null
  is_shared: boolean
  created_by: string
  created_at: string
  updated_at: string
  activity_count?: number
  member_count?: number
}

export interface CreatePlanInput {
  name: string
  description?: string
  start_date?: string
  end_date?: string
}

export interface UpdatePlanInput {
  name?: string
  description?: string
  cover_image_url?: string
  start_date?: string
  end_date?: string
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

// Get "Full Access" permission set ID (for plan owner)
async function getFullAccessPermissionSetId() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("p_permission_sets")
    .select("id")
    .eq("name", "Full Access")
    .eq("is_system", true)
    .single()

  return data?.id
}

// Get all plans for the current organization
export async function getPlans(): Promise<{ plans: Plan[], error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { plans: [], error: "Unauthorized" }
  }

  const orgId = await getSelectedOrganization()
  if (!orgId) {
    return { plans: [], error: "No organization selected" }
  }

  // Get plans where user is a member
  const { data: memberPlans, error: memberError } = await supabase
    .from("p_plan_members")
    .select("plan_id")
    .eq("profile_id", profile.id)
    .eq("status", "active")

  if (memberError) {
    console.error("Error fetching member plans:", memberError)
    return { plans: [], error: memberError.message }
  }

  const planIds = memberPlans?.map(m => m.plan_id) || []

  if (planIds.length === 0) {
    return { plans: [], error: null }
  }

  // Get plan details
  const { data: plans, error: plansError } = await supabase
    .from("p_plans")
    .select("*")
    .in("id", planIds)
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })

  if (plansError) {
    console.error("Error fetching plans:", plansError)
    return { plans: [], error: plansError.message }
  }

  // Get member counts for each plan
  const plansWithCounts = await Promise.all(
    (plans || []).map(async (plan) => {
      const { count: memberCount } = await supabase
        .from("p_plan_members")
        .select("*", { count: "exact", head: true })
        .eq("plan_id", plan.id)
        .eq("status", "active")

      return {
        ...plan,
        member_count: memberCount || 0,
        activity_count: 0 // Will be implemented in Phase 2
      }
    })
  )

  return { plans: plansWithCounts, error: null }
}

// Get a single plan by ID
export async function getPlan(planId: string): Promise<{ plan: Plan | null, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { plan: null, error: "Unauthorized" }
  }

  // Check if user is a member of this plan
  const { data: membership } = await supabase
    .from("p_plan_members")
    .select("*")
    .eq("plan_id", planId)
    .eq("profile_id", profile.id)
    .eq("status", "active")
    .single()

  if (!membership) {
    return { plan: null, error: "You don't have access to this plan" }
  }

  const { data: plan, error } = await supabase
    .from("p_plans")
    .select("*")
    .eq("id", planId)
    .single()

  if (error) {
    return { plan: null, error: error.message }
  }

  return { plan, error: null }
}

// Create a new plan
export async function createPlan(input: CreatePlanInput): Promise<{ plan: Plan | null, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { plan: null, error: "Unauthorized" }
  }

  const orgId = await getSelectedOrganization()
  if (!orgId) {
    return { plan: null, error: "No organization selected" }
  }

  // Check if user is staff in this org
  const { data: orgUser } = await supabase
    .from("org_user")
    .select("role_id")
    .eq("org_id", orgId)
    .eq("profile_id", profile.id)
    .gte("role_id", 1)
    .single()

  if (!orgUser) {
    return { plan: null, error: "You don't have permission to create plans in this organization" }
  }

  // Get user's email for membership
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { plan: null, error: "Could not get user email" }
  }

  // Get Full Access permission set
  const fullAccessId = await getFullAccessPermissionSetId()
  if (!fullAccessId) {
    return { plan: null, error: "Could not find Full Access permission set" }
  }

  // Create the plan
  const { data: plan, error: planError } = await supabase
    .from("p_plans")
    .insert({
      org_id: orgId,
      name: input.name,
      description: input.description || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      created_by: profile.id
    })
    .select()
    .single()

  if (planError) {
    console.error("Error creating plan:", planError)
    return { plan: null, error: planError.message }
  }

  // Add the creator as owner with Full Access
  const { error: memberError } = await supabase
    .from("p_plan_members")
    .insert({
      plan_id: plan.id,
      profile_id: profile.id,
      email: user.email,
      permission_set_id: fullAccessId,
      membership_type: "internal",
      is_owner: true,
      invited_by: profile.id,
      accepted_at: new Date().toISOString(),
      status: "active"
    })

  if (memberError) {
    console.error("Error adding owner membership:", memberError)
    // Delete the plan if we couldn't add the owner
    await supabase.from("p_plans").delete().eq("id", plan.id)
    return { plan: null, error: "Could not set up plan ownership" }
  }

  revalidatePath("/planify")
  return { plan, error: null }
}

// Update a plan
export async function updatePlan(
  planId: string,
  input: UpdatePlanInput
): Promise<{ success: boolean, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { success: false, error: "Unauthorized" }
  }

  // Check permission via RLS (will fail if user doesn't have plan.edit)
  const { error } = await supabase
    .from("p_plans")
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq("id", planId)

  if (error) {
    console.error("Error updating plan:", error)
    if (error.code === "42501") {
      return { success: false, error: "You don't have permission to edit this plan" }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/planify")
  revalidatePath(`/planify/${planId}`)
  return { success: true, error: null }
}

// Delete a plan
export async function deletePlan(planId: string): Promise<{ success: boolean, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if user is the owner
  const { data: membership } = await supabase
    .from("p_plan_members")
    .select("is_owner")
    .eq("plan_id", planId)
    .eq("profile_id", profile.id)
    .eq("status", "active")
    .single()

  if (!membership?.is_owner) {
    return { success: false, error: "Only the plan owner can delete a plan" }
  }

  const { error } = await supabase
    .from("p_plans")
    .delete()
    .eq("id", planId)

  if (error) {
    console.error("Error deleting plan:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/planify")
  return { success: true, error: null }
}

// Upload plan cover image
export async function uploadPlanCover(
  planId: string,
  formData: FormData
): Promise<{ url: string | null, error: string | null }> {
  const supabase = await createClient()
  const profile = await getProfile()

  if (!profile) {
    return { url: null, error: "Unauthorized" }
  }

  const file = formData.get("file") as File
  if (!file || file.size === 0) {
    return { url: null, error: "No file provided" }
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { url: null, error: "File must be an image" }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { url: null, error: "File size must be less than 5MB" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `planify/${planId}/cover_${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(fileName, file, { upsert: true })

  if (uploadError) {
    console.error("Upload error:", uploadError)
    return { url: null, error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from("uploads")
    .getPublicUrl(fileName)

  // Update the plan with the new cover URL
  const { error: updateError } = await supabase
    .from("p_plans")
    .update({ cover_image_url: publicUrl })
    .eq("id", planId)

  if (updateError) {
    return { url: null, error: updateError.message }
  }

  revalidatePath("/planify")
  revalidatePath(`/planify/${planId}`)
  return { url: publicUrl, error: null }
}

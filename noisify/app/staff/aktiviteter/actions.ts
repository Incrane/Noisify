'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function checkOrgStatus(orgId: string, supabase: any) {
  const { data: org } = await supabase
    .from('organizations')
    .select('org_status')
    .eq('id', orgId)
    .single();

  if (org?.org_status === 'pending') {
    throw new Error('Organisationen väntar på godkännande. Du kan inte skapa eller redigera aktiviteter.');
  }
}

export async function updateRegistrationStatus(registrationId: string, status: string, activityId: string, notes?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Du är inte inloggad' };

  // Check capacity if accepting
  if (status === 'ACCEPTED') {
    const { data: activity } = await supabase
      .from('activity_dashboard')
      .select('total_kapacitet, antal_godkanda')
      .eq('activity_id', activityId)
      .single();

    if (activity && activity.total_kapacitet !== null && activity.antal_godkanda >= activity.total_kapacitet) {
      return { success: false, error: 'Aktiviteten är fullbokad. Du kan inte godkänna fler deltagare.' };
    }
  }

  const updatePayload: { status: string; notes?: string } = { status };
  if (notes && notes.trim().length > 0) {
    updatePayload.notes = notes.trim();
  }

  const { error } = await supabase
    .from("registration")
    .update(updatePayload)
    .eq("id", registrationId);

  if (error) {
    console.error("Update status error:", error);
    // Translate common errors
    if (error.code === '42501') {
      return { success: false, error: "Du har inte behörighet att ändra status." };
    }
    return { success: false, error: `Kunde inte uppdatera status: ${error.message}` };
  }

  revalidatePath(`/staff/aktiviteter/${activityId}`);
  return { success: true, message: "Status uppdaterad" };
}

export async function updateActivity(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const activityId = formData.get('activity_id') as string;
  if (!activityId) throw new Error('Activity ID missing');

  // Check Org Status
  const { data: existingActivity } = await supabase
    .from('activity')
    .select('owner_org_id')
    .eq('id', activityId)
    .single();

  if (existingActivity) {
    await checkOrgStatus(existingActivity.owner_org_id, supabase);
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const address = formData.get('address') as string;
  const capacity = formData.get('capacity') ? parseInt(formData.get('capacity') as string) : null;
  const imageUrl = formData.get('image_url') as string;

  // PowerUps & Extra Fields
  const reserveCapacity = formData.get('reserve_capacity') ? parseInt(formData.get('reserve_capacity') as string) : 0;
  const registrationRules = formData.get('registration_rules') as string || 'OPEN_FOR_ALL';
  const ageMin = formData.get('age_min') ? parseInt(formData.get('age_min') as string) : null;
  const ageMax = formData.get('age_max') ? parseInt(formData.get('age_max') as string) : null;

  const deadlineStr = formData.get('registration_deadline') as string;
  const registrationDeadline = deadlineStr ? new Date(deadlineStr).toISOString() : null;

  // Dates
  const dateStart = formData.get('date_start') as string;
  const timeStart = formData.get('time_start') as string;
  const dateEnd = formData.get('date_end') as string;
  const timeEnd = formData.get('time_end') as string;

  const startsAt = new Date(`${dateStart}T${timeStart}`).toISOString();
  const endsAt = new Date(`${dateEnd}T${timeEnd}`).toISOString();

  // Determine Status from Action
  const action = formData.get('action') as string;
  let status = 'PUBLISHED';
  if (action === 'draft') status = 'DRAFT';
  else if (action === 'archive') status = 'ARCHIVED';

  // Define type for update payload
  type UpdateActivityPayload = {
    name: string;
    description: string;
    starts_at: string;
    ends_at: string;
    address: string;
    capacity: number | null;
    reserve_capacity: number;
    registration_deadline: string | null;
    age_min: number | null;
    age_max: number | null;
    registration_rules: string;
    updated_at: string;
    image_url?: string;
    status?: string;
  };

  const updateData: UpdateActivityPayload = {
    name,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    address,
    capacity,
    reserve_capacity: reserveCapacity,
    registration_deadline: registrationDeadline,
    age_min: ageMin,
    age_max: ageMax,
    registration_rules: registrationRules,
    updated_at: new Date().toISOString()
  };

  if (imageUrl) updateData.image_url = imageUrl;

  // Only update status if an action was explicitly clicked (otherwise keep existing?)
  // Actually, the form always submits via button with name="action".
  if (action) {
    updateData.status = status;
  }

  const { error } = await supabase
    .from('activity')
    .update(updateData)
    .eq('id', activityId);

  if (error) {
    console.error('Update activity error:', error);
    throw new Error(`Kunde inte uppdatera aktivitet: ${error.message}`);
  }

  revalidatePath('/staff/aktiviteter');
  revalidatePath(`/staff/aktiviteter/${activityId}`);
  revalidatePath('/app/aktiviteter');
}

export async function createActivity(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const address = formData.get('address') as string;
  const capacity = formData.get('capacity') ? parseInt(formData.get('capacity') as string) : null;
  const orgId = formData.get('org_id') as string;

  await checkOrgStatus(orgId, supabase);

  const imageUrl = formData.get('image_url') as string;

  // PowerUps & Extra Fields
  const reserveCapacity = formData.get('reserve_capacity') ? parseInt(formData.get('reserve_capacity') as string) : 0;
  const registrationRules = formData.get('registration_rules') as string || 'OPEN_FOR_ALL';
  const ageMin = formData.get('age_min') ? parseInt(formData.get('age_min') as string) : null;
  const ageMax = formData.get('age_max') ? parseInt(formData.get('age_max') as string) : null;

  const deadlineStr = formData.get('registration_deadline') as string;
  const registrationDeadline = deadlineStr ? new Date(deadlineStr).toISOString() : null;

  // Dates
  const dateStart = formData.get('date_start') as string;
  const timeStart = formData.get('time_start') as string;
  const dateEnd = formData.get('date_end') as string;
  const timeEnd = formData.get('time_end') as string;

  const startsAt = new Date(`${dateStart}T${timeStart}`).toISOString();
  const endsAt = new Date(`${dateEnd}T${timeEnd}`).toISOString();

  // Status (Draft/Publish)
  // Default to PUBLISHED if not specified, or handle 'action' field if we add it
  // For now assuming PUBLISHED unless we implement draft logic fully
  const status = formData.get('status') as string || 'PUBLISHED';

  const { error } = await supabase.from('activity').insert({
    owner_org_id: orgId,
    name,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    address,
    capacity,
    image_url: imageUrl,
    reserve_capacity: reserveCapacity,
    registration_deadline: registrationDeadline,
    age_min: ageMin,
    age_max: ageMax,
    activity_type: formData.get('activity_type') as string || 'NORMAL',
    status,
    visibility: formData.get('visibility') as string || 'PUBLIC',
    registration_rules: registrationRules,
    created_by: profile.id
  });

  if (error) {
    console.error('Create activity error:', error);
    throw new Error(`Kunde inte skapa aktivitet: ${error.message}`);
  }

  revalidatePath('/staff/aktiviteter');
  revalidatePath('/aktiviteter'); // Public list
  revalidatePath('/app/aktiviteter'); // App list
}

export async function searchUsers(query: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Limit search to top 10 matches
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, alias, fodd_ar')
    .ilike('alias', `%${query}%`)
    .limit(10);

  if (error) {
    console.error('Search users error:', error);
    return [];
  }

  return profiles || [];
}

export async function createRegistration(activityId: string, profileId: string, status: string = 'ACCEPTED') {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Check capacity if accepting
  if (status === 'ACCEPTED') {
    const { data: activity } = await supabase
      .from('activity_dashboard')
      .select('total_kapacitet, antal_godkanda')
      .eq('activity_id', activityId)
      .single();

    if (activity && activity.total_kapacitet !== null && activity.antal_godkanda >= activity.total_kapacitet) {
      return { success: false, error: 'Aktiviteten är fullbokad' };
    }
  }

  // Check if already registered
  const { data: existing } = await supabase
    .from('registration')
    .select('id')
    .eq('activity_id', activityId)
    .eq('profile_id', profileId)
    .single();

  if (existing) {
    // If exists, update status
    const { error } = await supabase
      .from('registration')
      .update({ status })
      .eq('id', existing.id);

    if (error) return { success: false, error: 'Kunde inte uppdatera befintlig registrering' };
  } else {
    // Create new
    const { error } = await supabase
      .from('registration')
      .insert({
        activity_id: activityId,
        profile_id: profileId,
        status
      });

    if (error) return { success: false, error: 'Kunde inte skapa registrering' };
  }

  revalidatePath(`/staff/aktiviteter/${activityId}`);
  return { success: true, message: "Registrering skapad" };
}

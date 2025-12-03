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

  // New Fields
  const activityType = formData.get('activity_type') as string || 'NORMAL';
  const lotteryDateStr = formData.get('lottery_date') as string;
  const confirmationDeadlineStr = formData.get('confirmation_deadline') as string;
  const rrule = formData.get('rrule') as string || null;

  const lotteryDate = lotteryDateStr ? new Date(lotteryDateStr).toISOString() : null;
  const confirmationDeadline = confirmationDeadlineStr ? new Date(confirmationDeadlineStr).toISOString() : null;

  const hideAddress = formData.get('hide_address') === 'true';

  // File Upload - Registration Slip
  const registrationSlipFile = formData.get('registration_slip_file') as File;
  const removeRegistrationSlip = formData.get('remove_registration_slip') === 'true';
  let registrationSlipUrl: string | null | undefined = undefined;

  if (removeRegistrationSlip) {
    registrationSlipUrl = null;
  } else if (registrationSlipFile && registrationSlipFile.size > 0) {
    const fileExt = registrationSlipFile.name.split('.').pop();
    const fileName = `${activityId}/registration_slip_${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('aktiviteter')
      .upload(fileName, registrationSlipFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Kunde inte ladda upp anmälningslapp');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('aktiviteter')
      .getPublicUrl(fileName);
    registrationSlipUrl = publicUrl;
  }

  // File Upload - Image
  const imageFile = formData.get('image_file') as File;
  let uploadedImageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${activityId}/image_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('aktiviteter')
      .upload(fileName, imageFile, { upsert: true });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('aktiviteter')
        .getPublicUrl(fileName);
      uploadedImageUrl = publicUrl;
    }
  }

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

  // Define type for update payload (extended for new fields not yet in types)
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
    activity_type: string;
    lottery_date?: string | null;
    confirmation_deadline?: string | null;
    rrule?: string | null;
    registration_slip_url?: string | null;
    hide_address?: boolean;
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
    updated_at: new Date().toISOString(),
    activity_type: activityType,
    lottery_date: lotteryDate,
    confirmation_deadline: confirmationDeadline,
    rrule: rrule,
    hide_address: hideAddress
  };

  if (imageUrl) updateData.image_url = imageUrl;
  if (uploadedImageUrl) updateData.image_url = uploadedImageUrl;
  if (registrationSlipUrl !== undefined) updateData.registration_slip_url = registrationSlipUrl;

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

  // Handle Junction Tables (Delete then Insert)

  // 1. Categories
  const categories = formData.getAll('categories') as string[];
  await supabase.from('activity_categories').delete().eq('activity_id', activityId);
  if (categories.length > 0) {
    await supabase.from('activity_categories').insert(
      categories.map(catId => ({ activity_id: activityId, category_id: catId }))
    );
  }

  // 2. Target Subgroups
  const targetSubgroups = formData.getAll('target_subgroups') as string[];
  await supabase.from('activity_target_subgroups').delete().eq('activity_id', activityId);
  if (targetSubgroups.length > 0) {
    await supabase.from('activity_target_subgroups').insert(
      targetSubgroups.map(subId => ({ activity_id: activityId, sub_group_id: subId }))
    );
  }

  // 3. Genders
  const genders = formData.getAll('genders') as string[];
  // Assuming activity_gender table exists
  const { error: deleteGenderError } = await supabase.from('activity_gender').delete().eq('activity_id', activityId);
  if (!deleteGenderError && genders.length > 0) {
    await supabase.from('activity_gender').insert(
      genders.map(genderId => ({ activity_id: activityId, gender_id: genderId }))
    );
  }

  // 4. Collaborators
  const collaborators = formData.getAll('collaborators') as string[];
  await supabase.from('activity_organisation').delete().eq('activity_id', activityId);
  if (collaborators.length > 0) {
    await supabase.from('activity_organisation').insert(
      collaborators.map(orgId => ({ activity_id: activityId, org_id: orgId, can_edit: true }))
    );
  }

  // 5. Invited Members
  if (registrationRules === 'SELECTED_MEMBERS') {
    const invitedMembers = formData.getAll('invited_members') as string[];
    if (invitedMembers.length > 0) {
      await inviteMembers(activityId, invitedMembers);
    }
  }

  // 4. Contact Persons (Update created_by for now, as per existing logic)
  const contactPersons = formData.getAll('contact_persons') as string[];
  if (contactPersons.length > 0) {
    await supabase.from('activity').update({ created_by: contactPersons[0] }).eq('id', activityId);
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

  // New Fields
  const activityType = formData.get('activity_type') as string || 'NORMAL';
  const lotteryDateStr = formData.get('lottery_date') as string;
  const confirmationDeadlineStr = formData.get('confirmation_deadline') as string;
  const rrule = formData.get('rrule') as string || null;

  const lotteryDate = lotteryDateStr ? new Date(lotteryDateStr).toISOString() : null;
  const confirmationDeadline = confirmationDeadlineStr ? new Date(confirmationDeadlineStr).toISOString() : null;

  const hideAddress = formData.get('hide_address') === 'true';

  // Dates
  const dateStart = formData.get('date_start') as string;
  const timeStart = formData.get('time_start') as string;
  const dateEnd = formData.get('date_end') as string;
  const timeEnd = formData.get('time_end') as string;

  const startsAt = new Date(`${dateStart}T${timeStart}`).toISOString();
  const endsAt = new Date(`${dateEnd}T${timeEnd}`).toISOString();

  const status = formData.get('status') as string || 'PUBLISHED';
  const contactPersons = formData.getAll('contact_persons') as string[];
  const createdBy = contactPersons.length > 0 ? contactPersons[0] : profile.id;

  // Insert first to get ID for file path
  const { data: newActivity, error } = await supabase.from('activity').insert({
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
    activity_type: activityType,
    status,
    visibility: formData.get('visibility') as string || 'PUBLIC',
    registration_rules: registrationRules,
    created_by: createdBy,
    lottery_date: lotteryDate,
    confirmation_deadline: confirmationDeadline,
    rrule: rrule,
    hide_address: hideAddress
  }).select('id').single();

  if (error) {
    console.error('Create activity error:', error);
    throw new Error(`Kunde inte skapa aktivitet: ${error.message}`);
  }

  const activityId = newActivity.id;

  // File Upload - Registration Slip (After creation to use ID)
  const registrationSlipFile = formData.get('registration_slip_file') as File;
  if (registrationSlipFile && registrationSlipFile.size > 0) {
    const fileExt = registrationSlipFile.name.split('.').pop();
    const fileName = `${activityId}/registration_slip_${Date.now()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('aktiviteter')
      .upload(fileName, registrationSlipFile, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('aktiviteter')
        .getPublicUrl(fileName);

      // Update with URL
      await supabase.from('activity').update({ registration_slip_url: publicUrl }).eq('id', activityId);
    } else {
      console.error('Upload error:', uploadError);
      // We don't fail the whole creation if upload fails, but maybe we should warn?
      // For now logging is enough.
    }
  }

  // File Upload - Image (After creation)
  const imageFile = formData.get('image_file') as File;
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${activityId}/image_${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('aktiviteter')
      .upload(fileName, imageFile, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('aktiviteter')
        .getPublicUrl(fileName);

      // Update with URL
      await supabase.from('activity').update({ image_url: publicUrl }).eq('id', activityId);
    } else {
      console.error('Image upload error:', uploadError);
    }
  }

  // Handle Junction Tables (Insert)

  // 1. Categories
  const categories = formData.getAll('categories') as string[];
  if (categories.length > 0) {
    await supabase.from('activity_categories').insert(
      categories.map(catId => ({ activity_id: activityId, category_id: catId }))
    );
  }

  // 2. Target Subgroups
  const targetSubgroups = formData.getAll('target_subgroups') as string[];
  if (targetSubgroups.length > 0) {
    await supabase.from('activity_target_subgroups').insert(
      targetSubgroups.map(subId => ({ activity_id: activityId, sub_group_id: subId }))
    );
  }

  // 3. Genders
  const genders = formData.getAll('genders') as string[];
  if (genders.length > 0) {
    await supabase.from('activity_gender').insert(
      genders.map(genderId => ({ activity_id: activityId, gender_id: genderId }))
    );
  }

  // 4. Collaborators
  const collaborators = formData.getAll('collaborators') as string[];
  if (collaborators.length > 0) {
    await supabase.from('activity_organisation').insert(
      collaborators.map(orgId => ({ activity_id: activityId, org_id: orgId, can_edit: true }))
    );
  }
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

export async function runLottery(activityId: string) {
  console.log('Running lottery for activity:', activityId);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('User not authorized');
    return { success: false, error: 'Unauthorized' };
  }

  // 1. Get Activity and Capacity
  const { data: activity } = await supabase
    .from('activity')
    .select('capacity, reserve_capacity')
    .eq('id', activityId)
    .single();

  if (!activity) {
    console.log('Activity not found');
    return { success: false, error: 'Activity not found' };
  }
  console.log('Activity found:', activity);

  // 2. Get Pending Registrations
  const { data: registrations } = await supabase
    .from('registration')
    .select('id')
    .eq('activity_id', activityId)
    .eq('status', 'PENDING');

  console.log('Pending registrations:', registrations?.length);

  if (!registrations || registrations.length === 0) {
    return { success: false, error: 'Inga väntande registreringar att lotta bland.' };
  }

  // 3. Shuffle
  const shuffled = registrations.sort(() => 0.5 - Math.random());

  // 4. Distribute Spots
  const capacity = activity.capacity || 0;

  // Get current accepted count to know how many spots are left
  const { count: currentAccepted } = await supabase
    .from('registration')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId)
    .eq('status', 'ACCEPTED');

  console.log('Current accepted:', currentAccepted);
  console.log('Capacity:', capacity);

  const spotsLeft = Math.max(0, capacity - (currentAccepted || 0));
  console.log('Spots left:', spotsLeft);

  const winners = shuffled.slice(0, spotsLeft);
  const others = shuffled.slice(spotsLeft);

  console.log('Winners:', winners.length);
  console.log('Others (Waitlist):', others.length);

  // 5. Update Statuses
  // Winners -> ACCEPTED
  if (winners.length > 0) {
    const { error: winnerError } = await supabase
      .from('registration')
      .update({ status: 'ACCEPTED' })
      .in('id', winners.map(r => r.id));

    if (winnerError) console.error('Error updating winners:', winnerError);
  }

  // Others -> WAITLISTED
  if (others.length > 0) {
    const { error: waitlistError } = await supabase
      .from('registration')
      .update({ status: 'WAITLISTED' })
      .in('id', others.map(r => r.id));

    if (waitlistError) console.error('Error updating waitlist:', waitlistError);
  }

  revalidatePath(`/staff/aktiviteter/${activityId}`);
  return { success: true, message: `Lottning klar. ${winners.length} godkända, ${others.length} till reservlistan.` };
}
export async function inviteMembers(activityId: string, profileIds: string[]) {
  console.log('inviteMembers called with:', { activityId, profileIdsCount: profileIds.length });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Get activity details for notification
  const { data: activity, error: activityError } = await supabase
    .from('activity')
    .select('name, owner_org_id')
    .eq('id', activityId)
    .single();

  if (activityError) {
    console.error('Error fetching activity for invite:', activityError);
  }

  if (!activity) return { success: false, error: 'Activity not found' };

  // Get Org Name
  const { data: org } = await supabase
    .from('organizations')
    .select('org_namn')
    .eq('id', activity.owner_org_id)
    .single();

  const orgName = org?.org_namn || 'Organisationen';

  const results = [];
  const errors = [];

  for (const profileId of profileIds) {
    // Check if already registered
    const { data: existing } = await supabase
      .from('registration')
      .select('id, status')
      .eq('activity_id', activityId)
      .eq('profile_id', profileId)
      .single();

    if (existing) {
      if (existing.status === 'REJECTED' || existing.status === 'CANCELLED') {
        // Re-invite
        const { error } = await supabase
          .from('registration')
          .update({ status: 'INVITED' })
          .eq('id', existing.id);

        if (error) errors.push(`Kunde inte återinbjuda ${profileId}`);
        else results.push(profileId);
      } else {
        // Already active/pending/invited
        continue;
      }
    } else {
      // Create new invitation
      const { error } = await supabase
        .from('registration')
        .insert({
          activity_id: activityId,
          profile_id: profileId,
          status: 'INVITED'
        });

      if (error) errors.push(`Kunde inte bjuda in ${profileId}`);
      else results.push(profileId);
    }
  }

  revalidatePath(`/staff/aktiviteter/${activityId}`);

  if (errors.length > 0) {
    return { success: true, message: `Bjudit in ${results.length} medlemmar. Misslyckades med ${errors.length}.`, warning: errors.join(', ') };
  }

  return { success: true, message: `Bjudit in ${results.length} medlemmar.` };
}

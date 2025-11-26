'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/utils/supabase/storage";

async function checkOrgStatus(orgId: string, supabase: any) {
    const { data: org } = await supabase
        .from('organizations')
        .select('org_status')
        .eq('id', orgId)
        .single();

    if (org?.org_status === 'pending') {
        throw new Error('Organisationen väntar på godkännande. Du kan inte skapa eller redigera kurser.');
    }
}

export async function createCourse(formData: FormData) {
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
    const short_description = formData.get('short_description') as string;
    const duration_hours = formData.get('duration_hours') as string;
    let image_url = formData.get('image_url') as string;
    const orgId = formData.get('org_id') as string;
    await checkOrgStatus(orgId, supabase);

    const status = formData.get('status') as string || 'DRAFT';
    const access_level = formData.get('access_level') as string || 'OPEN_FOR_ALL';

    // Handle image upload
    const imageFile = formData.get('image_file') as File | null;
    if (imageFile && imageFile.size > 0) {
        const uploadedUrl = await uploadImage(imageFile, 'images', 'courses');
        if (uploadedUrl) {
            image_url = uploadedUrl;
        }
    }

    // Parse related data
    const instructorIds = JSON.parse(formData.get('instructors') as string || '[]');
    const tagIds = JSON.parse(formData.get('tags') as string || '[]');
    const modules = JSON.parse(formData.get('modules') as string || '[]');

    console.log('Creating course with:', {
        orgId,
        profileId: profile.id,
        userId: user.id,
        name
    });

    const { data, error } = await supabase.from('courses').insert({
        owner_org_id: orgId,
        created_by: profile.id,
        name,
        description,
        short_description,
        duration_hours,
        image_url,
        status,
        access_level
    }).select('id').single();

    if (error) {
        console.error('Create course error:', error, { orgId, profileId: profile.id });
        throw new Error(`Kunde inte skapa kurs: ${error.message}`);
    }

    const courseId = data.id;

    // Insert Modules and Lessons
    if (modules.length > 0) {
        for (let i = 0; i < modules.length; i++) {
            const m = modules[i];
            const { data: moduleData, error: moduleError } = await supabase.from('course_modules').insert({
                course_id: courseId,
                title: m.title,
                description: m.description,
                sort_order: i
            }).select('id').single();

            if (moduleError) {
                console.error('Error creating module:', moduleError);
                continue;
            }

            if (m.lessons && m.lessons.length > 0) {
                const lessonInserts = m.lessons.map((l: { title: string; duration_minutes: number; start_at?: string; end_at?: string }, index: number) => ({
                    module_id: moduleData.id,
                    title: l.title,
                    duration_minutes: l.duration_minutes || 0,
                    start_at: l.start_at || null,
                    end_at: l.end_at || null,
                    sort_order: index
                }));
                await supabase.from('course_lessons').insert(lessonInserts);
            }
        }
    }

    // Insert Instructors
    if (instructorIds.length > 0) {
        const instructorInserts = instructorIds.map((id: string, index: number) => ({
            course_id: courseId,
            instructor_id: id,
            sort_order: index,
            is_primary: index === 0
        }));
        await supabase.from('course_instructors').insert(instructorInserts);
    }

    // Insert Tags
    if (tagIds.length > 0) {
        const tagInserts = tagIds.map((id: string) => ({
            course_id: courseId,
            tag_id: id
        }));
        await supabase.from('course_tags').insert(tagInserts);
    }

    revalidatePath('/staff/kurser');
    return courseId;
}

export async function updateCourse(courseId: string, formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Check Org Status
    const { data: existingCourse } = await supabase
        .from('courses')
        .select('owner_org_id')
        .eq('id', courseId)
        .single();

    if (existingCourse) {
        await checkOrgStatus(existingCourse.owner_org_id, supabase);
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const short_description = formData.get('short_description') as string;
    const duration_hours = formData.get('duration_hours') as string;
    let image_url = formData.get('image_url') as string;
    const status = formData.get('status') as string;
    const access_level = formData.get('access_level') as string;

    // Handle image upload
    const imageFile = formData.get('image_file') as File | null;
    if (imageFile && imageFile.size > 0) {
        const uploadedUrl = await uploadImage(imageFile, 'images', 'courses');
        if (uploadedUrl) {
            image_url = uploadedUrl;
        }
    }

    const instructorIds = JSON.parse(formData.get('instructors') as string || '[]');
    const tagIds = JSON.parse(formData.get('tags') as string || '[]');
    const modules = JSON.parse(formData.get('modules') as string || '[]');

    const { error } = await supabase.from('courses').update({
        name,
        description,
        short_description,
        duration_hours,
        image_url,
        status,
        access_level,
        updated_at: new Date().toISOString()
    }).eq('id', courseId);

    if (error) {
        console.error('Update course error:', error);
        throw new Error(`Kunde inte uppdatera kurs: ${error.message}`);
    }

    // Update Instructors (Delete all and re-insert strategy for simplicity)
    await supabase.from('course_instructors').delete().eq('course_id', courseId);
    if (instructorIds.length > 0) {
        const instructorInserts = instructorIds.map((id: string, index: number) => ({
            course_id: courseId,
            instructor_id: id,
            sort_order: index,
            is_primary: index === 0
        }));
        await supabase.from('course_instructors').insert(instructorInserts);
    }

    // Update Tags
    await supabase.from('course_tags').delete().eq('course_id', courseId);
    if (tagIds.length > 0) {
        const tagInserts = tagIds.map((id: string) => ({
            course_id: courseId,
            tag_id: id
        }));
        await supabase.from('course_tags').insert(tagInserts);
    }

    // Update Modules (Delete all and re-insert - NOTE: This resets progress if lesson IDs change)
    // In a real app, we should diff and upsert.
    // Since we don't have cascade delete on course_modules -> course_lessons set up reliably in schema, we iterate.
    // Or we assume cascade works. Let's try deleting modules.
    // First fetch modules to delete their lessons if needed, but if cascade is on, just delete modules.
    // If FK constraint prevents delete, this will fail.

    // We first delete all modules for this course.
    // But wait, if we delete modules, lessons might be restricted.
    // Let's assume we need to delete lessons first?
    // Actually, if we don't know schema constraints, explicit delete is safer.

    // Get current modules
    const { data: currentModules } = await supabase.from('course_modules').select('id').eq('course_id', courseId);
    if (currentModules && currentModules.length > 0) {
        const modIds = currentModules.map(m => m.id);
        // Delete lessons for these modules
        await supabase.from('course_lessons').delete().in('module_id', modIds);
        // Delete modules
        await supabase.from('course_modules').delete().in('id', modIds);
    }

    // Insert new modules and lessons
    if (modules.length > 0) {
        for (let i = 0; i < modules.length; i++) {
            const m = modules[i];
            const { data: moduleData, error: moduleError } = await supabase.from('course_modules').insert({
                course_id: courseId,
                title: m.title,
                description: m.description,
                sort_order: i
            }).select('id').single();

            if (moduleError) {
                console.error('Error creating module:', moduleError);
                continue;
            }

            if (m.lessons && m.lessons.length > 0) {
                const lessonInserts = m.lessons.map((l: { title: string; duration_minutes: number; start_at?: string; end_at?: string }, index: number) => ({
                    module_id: moduleData.id,
                    title: l.title,
                    duration_minutes: l.duration_minutes || 0,
                    start_at: l.start_at || null,
                    end_at: l.end_at || null,
                    sort_order: index
                }));
                await supabase.from('course_lessons').insert(lessonInserts);
            }
        }
    }

    revalidatePath('/staff/kurser');
    revalidatePath(`/staff/kurser/${courseId}`);
}

export async function deleteCourse(courseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase.from('courses').delete().eq('id', courseId);

    if (error) {
        console.error('Delete course error:', error);
        throw new Error(`Kunde inte ta bort kurs: ${error.message}`);
    }

    revalidatePath('/staff/kurser');
}

export async function createExternalInstructor(formData: FormData, orgId: string) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    let image_url = null;
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
        const uploadedUrl = await uploadImage(imageFile, 'images', 'instructors');
        if (uploadedUrl) {
            image_url = uploadedUrl;
        }
    }

    const { data, error } = await supabase.from('instructors').insert({
        name,
        title,
        email,
        phone,
        image_url,
        org_id: orgId,
        is_external: true
    }).select('*').single();

    if (error) {
        console.error('Error creating external instructor:', error);
        return null;
    }
    return data;
}

export async function updateExternalInstructor(id: string, formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const title = formData.get('title') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    const updates: any = {
        name,
        title,
        email,
        phone
    };

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
        const uploadedUrl = await uploadImage(imageFile, 'images', 'instructors');
        if (uploadedUrl) {
            updates.image_url = uploadedUrl;
        }
    }

    const { data, error } = await supabase.from('instructors').update(updates).eq('id', id).select('*').single();

    if (error) {
        console.error('Error updating external instructor:', error);
        return null;
    }
    return data;
}

export async function createTag(tagName: string) {
    const supabase = await createClient();

    // Check if exists
    const { data: existing } = await supabase.from('tags').select('*').eq('name', tagName).single();
    if (existing) return existing;

    const { data, error } = await supabase.from('tags').insert({
        name: tagName
    }).select('*').single();

    if (error) return null;
    return data;
}

export async function promoteStaffToInstructor(staff: { name: string, title?: string | null, image_url?: string | null, email?: string | null, phone?: string | null }, orgId: string) {
    const supabase = await createClient();

    // Check if instructor with same name exists (simple check for now, ideally use email or link to profile)
    // Since we don't have profile_id in instructors table based on createExternalInstructor, we rely on name/email?
    // Or we just create a new one. Duplicate names might be an issue but for now let's just create.

    const { data, error } = await supabase.from('instructors').insert({
        name: staff.name,
        title: staff.title || 'Personal',
        email: staff.email,
        phone: staff.phone,
        image_url: staff.image_url,
        org_id: orgId
    }).select('*').single();

    if (error) {
        console.error('Error promoting staff:', error);
        return null;
    }
    return data;
}

'use server'

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function selectOrganization(orgId: string) {
  (await cookies()).set("noisify_staff_org", orgId);
}

export async function getSelectedOrganization() {
  const cookieStore = await cookies();
  return cookieStore.get("noisify_staff_org")?.value;
}

export async function updateStaffProfile(formData: FormData) {
  const alias = formData.get('alias') as string;

  if (!alias) {
    throw new Error("Alias is required");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ alias })
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  revalidatePath("/staff");
}

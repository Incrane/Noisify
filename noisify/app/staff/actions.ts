'use server'

import { cookies } from "next/headers";

export async function selectOrganization(orgId: string) {
  (await cookies()).set("noisify_staff_org", orgId);
}

export async function getSelectedOrganization() {
  const cookieStore = await cookies();
  return cookieStore.get("noisify_staff_org")?.value;
}

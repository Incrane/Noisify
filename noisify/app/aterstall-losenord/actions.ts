"use server";
import { createClient } from "@/utils/supabase/server";

export async function updatePassword(password: string) {
   const supabase = await createClient();
   const { error } = await supabase.auth.updateUser({ password });
   if (error) throw new Error(error.message);
}

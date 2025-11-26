"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function resetPassword(email: string) {
    const supabase = await createClient();
    const origin = (await headers()).get("origin");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/aterstall-losenord`,
    });

    if (error) {
        throw new Error(error.message);
    }
}

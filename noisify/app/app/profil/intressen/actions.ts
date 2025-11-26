"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleInterest(formData: FormData) {
    const supabase = await createClient();
    const categoryId = formData.get("categoryId") as string;
    const profileId = formData.get("profileId") as string;
    const action = formData.get("action") as string;

    if (action === "add") {
        await supabase.from("profile_interests").insert({
            profile_id: profileId,
            category_id: categoryId,
        });
    } else {
        await supabase
            .from("profile_interests")
            .delete()
            .eq("profile_id", profileId)
            .eq("category_id", categoryId);
    }

    revalidatePath("/app/profil/intressen");
    revalidatePath("/app/profil");
}

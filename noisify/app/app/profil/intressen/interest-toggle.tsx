"use client";

import { toggleInterest } from "./actions";
import { useState } from "react";
import { useTransition } from "react";

export function InterestToggle({ category, isSelected: initialSelected, profileId }: any) {
    const [isPending, startTransition] = useTransition();
    // Optimistic UI could be added here, but for now we rely on revalidatePath in action

    return (
        <form action={toggleInterest}>
            <input type="hidden" name="categoryId" value={category.id} />
            <input type="hidden" name="profileId" value={profileId} />
            <input type="hidden" name="action" value={initialSelected ? "remove" : "add"} />
            <button
                type="submit"
                disabled={isPending}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${initialSelected
                        ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                style={initialSelected ? {
                    backgroundColor: category.bg_color || undefined,
                    color: category.color || undefined,
                } : undefined}
            >
                {category.cat_name}
            </button>
        </form>
    );
}

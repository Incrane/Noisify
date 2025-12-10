"use client";

import { useState } from "react";
import { Shield, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import MembershipApplicationModal from "./membership-application-modal";
import { toast } from "sonner";

interface MembershipButtonProps {
    orgId: string;
    initialMembership: {
        membership_state: string;
    } | null;
    membershipTypes: any[];
    profile: any;
}

export default function MembershipButton({ orgId, initialMembership, membershipTypes, profile }: MembershipButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    if (initialMembership) {
        const state = initialMembership.membership_state;

        if (state === 'active') {
            return (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-100 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    Medlem
                </div>
            );
        }

        if (state === 'rejected') {
            return (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full border border-red-100 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    Medlemskap nekat
                </div>
            );
        }

        if (state === 'cancelled' || state === 'expired') {
            return (
                <div className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2 rounded-full border border-slate-100 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    {state === 'cancelled' ? 'Avslutat' : 'Utgånget'}
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full border border-amber-100 font-medium">
                <ShieldCheck className="w-4 h-4" />
                {state === 'awaiting_visit' ? 'Väntar på besök' : 'Väntar på godkännande'}
            </div>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    console.log("[MembershipButton] Debug:", { orgId, profile, membershipTypes });
                    if (!profile) {
                        console.warn("No profile");
                        toast.error("Profil saknas");
                        return;
                    }
                    setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
                <Shield className="w-4 h-4" />
                Bli medlem
            </button>

            {profile && (
                <MembershipApplicationModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        router.refresh();
                    }}
                    orgId={orgId}
                    membershipTypes={membershipTypes}
                    profile={profile}
                />
            )}
        </>
    );
}

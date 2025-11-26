"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, CreditCard, Info, Loader2, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { applyForMembership } from "./actions";
import { cn } from "@/lib/utils";

interface MembershipType {
    id: string;
    name: string;
    description: string | null;
    price: number;
    min_age: number | null;
    max_age: number | null;
    card_design: any;
    approval_flow: "AUTO" | "MANUAL" | "IN_PERSON";
}

interface Profile {
    id: string;
    fodd_ar: number;
    [key: string]: any;
}

interface MembershipApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    orgId: string;
    membershipTypes: MembershipType[];
    profile: Profile;
}

export default function MembershipApplicationModal({
    isOpen,
    onClose,
    orgId,
    membershipTypes,
    profile,
}: MembershipApplicationModalProps) {
    const [selectedType, setSelectedType] = useState<MembershipType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentYear = new Date().getFullYear();
    const age = currentYear - profile.fodd_ar;

    const handleApply = async () => {
        if (!selectedType) return;

        setIsSubmitting(true);
        try {
            const result = await applyForMembership(orgId, selectedType.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Ansökan skickad!");
                onClose();
            }
        } catch (error) {
            toast.error("Ett fel uppstod vid ansökan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEligible = (type: MembershipType) => {
        if (type.min_age && age < type.min_age) return false;
        if (type.max_age && age > type.max_age) return false;
        return true;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white p-0 overflow-hidden gap-0">
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Bli medlem</DialogTitle>
                        <DialogDescription>
                            Välj det medlemskap som passar dig bäst.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        {membershipTypes.map((type) => {
                            const eligible = isEligible(type);
                            const isSelected = selectedType?.id === type.id;

                            return (
                                <div
                                    key={type.id}
                                    onClick={() => eligible && setSelectedType(type)}
                                    className={cn(
                                        "relative border rounded-xl p-4 transition-all cursor-pointer",
                                        isSelected
                                            ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50",
                                        !eligible && "opacity-50 cursor-not-allowed hover:border-slate-200 hover:bg-white"
                                    )}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900">{type.name}</h3>
                                                {type.price > 0 ? (
                                                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                        {type.price} kr
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                                                        Gratis
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{type.description}</p>

                                            {(type.min_age || type.max_age) && (
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>
                                                        {type.min_age && type.max_age
                                                            ? `${type.min_age}-${type.max_age} år`
                                                            : type.min_age
                                                                ? `${type.min_age}+ år`
                                                                : `Upp till ${type.max_age} år`}
                                                    </span>
                                                    {!eligible && (
                                                        <span className="text-red-500 font-medium ml-1">
                                                            (Du är {age} år)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div className="bg-indigo-600 text-white rounded-full p-1">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {membershipTypes.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                Inga medlemskap tillgängliga just nu.
                            </div>
                        )}
                    </div>

                    {selectedType && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 space-y-3">
                            <h4 className="font-medium text-slate-900 text-sm">Information om ansökan</h4>

                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-start gap-2">
                                    <Info className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                                    <span>
                                        {selectedType.approval_flow === "AUTO" && "Ditt medlemskap godkänns direkt."}
                                        {selectedType.approval_flow === "MANUAL" && "Din ansökan kommer att granskas av personalen."}
                                        {selectedType.approval_flow === "IN_PERSON" && "Du behöver besöka oss för att slutföra din ansökan."}
                                    </span>
                                </div>

                                {selectedType.card_design && (
                                    <div className="flex items-start gap-2">
                                        <CreditCard className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                                        <span>Du får ett digitalt medlemskort.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Avbryt
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={!selectedType || isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Skickar...
                            </>
                        ) : (
                            <>
                                Ansök nu
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

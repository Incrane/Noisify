"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AvatarPicker from "./avatar-picker";
import { completeProfile, checkAlias } from "@/app/app/profil/completion-actions";
import { Loader2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface CompleteProfileModalProps {
    isOpen: boolean;
    cities: { id: string; city: string }[];
    subgroups: { id: string; name: string }[];
    avatars: { name: string; url: string }[];
    initialData?: {
        alias?: string;
        firstName?: string;
        lastName?: string;
        cityId?: string;
        targetSubgroup?: string;
        avatarUrl?: string;
        phoneNumber?: string;
        genderId?: string;
        birthDate?: string;
    };
}

export default function CompleteProfileModal({
    isOpen,
    cities,
    subgroups,
    avatars,
    initialData,
}: CompleteProfileModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        alias: initialData?.alias || "",
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        cityId: initialData?.cityId || "",
        targetSubgroup: initialData?.targetSubgroup || "",
        avatarUrl: initialData?.avatarUrl || "",
        phoneNumber: initialData?.phoneNumber || "",
        birthDate: initialData?.birthDate ? new Date(initialData.birthDate) : undefined as Date | undefined,
    });

    const [aliasError, setAliasError] = useState<string | null>(null);

    // Prevent closing
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Do nothing, force stay open
        }
    };

    const validate = async () => {
        if (!formData.alias) return "Alias är obligatoriskt";
        if (!formData.firstName) return "Förnamn är obligatoriskt";
        if (!formData.lastName) return "Efternamn är obligatoriskt";
        if (!formData.cityId) return "Stad är obligatoriskt";
        if (!formData.targetSubgroup) return "Målgrupp är obligatoriskt";

        // Check alias
        const check = await checkAlias(formData.alias);
        if (!check.valid) {
            setAliasError(check.reason || "Ogiltigt alias");
            return "Ogiltigt alias";
        }
        setAliasError(null);

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const validationError = await validate();
            if (validationError) {
                setError(validationError);
                setLoading(false);
                return;
            }

            await completeProfile({
                alias: formData.alias,
                firstName: formData.firstName,
                lastName: formData.lastName,
                cityId: formData.cityId,
                targetSubgroup: formData.targetSubgroup,
                avatarUrl: formData.avatarUrl,
                phoneNumber: formData.phoneNumber,
                birthDate: formData.birthDate ? format(formData.birthDate, 'yyyy-MM-dd') : "",
            });

            // Refresh page to update state and close modal (via parent re-render)
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Ett fel uppstod");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-white">
                    <DialogHeader className="space-y-2">
                        <DialogTitle className="text-2xl font-bold tracking-tight">Välkommen till Noisify!</DialogTitle>
                        <DialogDescription className="text-indigo-100 text-base">
                            Vi behöver bara några sista detaljer för att göra din profil redo.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Personal Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                            Personuppgifter
                        </h3>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-slate-600 font-medium">Förnamn <span className="text-red-500">*</span></Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="T.ex. Anna"
                                    required
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-slate-600 font-medium">Efternamn <span className="text-red-500">*</span></Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="T.ex. Andersson"
                                    required
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="alias" className="text-slate-600 font-medium">Alias <span className="text-red-500">*</span></Label>
                            <Input
                                id="alias"
                                value={formData.alias}
                                onChange={(e) => {
                                    setFormData({ ...formData, alias: e.target.value });
                                    setAliasError(null);
                                }}
                                placeholder="Ditt unika användarnamn"
                                required
                                disabled={!!initialData?.alias}
                                className={`bg-slate-50 border-slate-200 focus:bg-white transition-colors h-11 ${aliasError ? "border-red-500 focus:ring-red-200" : ""} ${initialData?.alias ? "opacity-70 cursor-not-allowed bg-slate-100" : ""}`}
                            />
                            {aliasError ? (
                                <p className="text-sm text-red-500 font-medium flex items-center gap-1">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                    {aliasError}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-500">Detta namn visas för andra medlemmar i appen.</p>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Location & Group Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                            Tillhörighet
                        </h3>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-slate-600 font-medium">Stad <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <select
                                        id="city"
                                        value={formData.cityId}
                                        onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                                        className="flex h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-0 focus:bg-white focus:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        required
                                    >
                                        <option value="">Välj stad...</option>
                                        {cities.map((city) => (
                                            <option key={city.id} value={city.id}>
                                                {city.city}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subgroup" className="text-slate-600 font-medium">Målgrupp <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <select
                                        id="subgroup"
                                        value={formData.targetSubgroup}
                                        onChange={(e) => setFormData({ ...formData, targetSubgroup: e.target.value })}
                                        className="flex h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-0 focus:bg-white focus:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        required
                                    >
                                        <option value="">Välj målgrupp...</option>
                                        {subgroups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Avatar Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                Välj en Avatar
                            </h3>
                            <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full">Valfritt</span>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <AvatarPicker
                                avatars={avatars}
                                selectedAvatar={formData.avatarUrl}
                                onSelect={(url) => setFormData({ ...formData, avatarUrl: url })}
                            />
                        </div>
                    </div>

                    {/* Optional Info Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                Övrigt
                            </h3>
                            <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full">Valfritt</span>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="birthDate" className="text-slate-600 font-medium">Födelsedatum</Label>
                                <DatePicker
                                    date={formData.birthDate}
                                    setDate={(date) => setFormData({ ...formData, birthDate: date })}
                                    placeholder="Välj datum"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber" className="text-slate-600 font-medium">Telefonnummer</Label>
                                <Input
                                    id="phoneNumber"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="070-123 45 67"
                                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors h-11"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            {error}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Sparar profil...
                                </>
                            ) : (
                                "Spara och fortsätt"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

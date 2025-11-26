"use client";

import { useState, useRef, useEffect } from "react";
import { createMembershipType, deleteMembershipType, getPublicTargetSubgroups, updateMembershipType } from "@/app/staff/installningar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Trash2, Calendar as CalendarIcon, Plus, AlertCircle, CreditCard, Check, User, Users, ShieldCheck, Upload, X, Image as ImageIcon, Lock } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { uploadImage } from "@/utils/supabase/storage";
import Image from "next/image";

interface MembershipSettingsFormProps {
    membershipTypes: any[];
    roleId: number;
}

const CARD_COLORS = [
    { name: "Blue", value: "from-blue-500 to-indigo-600" },
    { name: "Purple", value: "from-purple-500 to-pink-600" },
    { name: "Green", value: "from-emerald-500 to-teal-600" },
    { name: "Orange", value: "from-orange-500 to-red-600" },
    { name: "Dark", value: "from-slate-700 to-slate-900" },
];

const CARD_ICONS = [
    { name: "User", icon: User },
    { name: "Users", icon: Users },
    { name: "Shield", icon: ShieldCheck },
    { name: "Star", icon: CreditCard },
];

export default function MembershipSettingsForm({ membershipTypes, roleId }: MembershipSettingsFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
    const isReadOnly = roleId < 3;

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);
    const [cardIcon, setCardIcon] = useState("User");
    const [requiresVerified, setRequiresVerified] = useState(false);

    // Refs for form reset
    const formRef = useRef<HTMLFormElement>(null);

    // Subgroups State
    const [targetSubgroups, setTargetSubgroups] = useState<string[]>([]);
    const [availableSubgroups, setAvailableSubgroups] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        async function loadSubgroups() {
            const { data, error } = await getPublicTargetSubgroups();
            if (data) {
                setAvailableSubgroups(data);
            } else {
                console.error("Failed to load subgroups:", error);
                toast.error("Kunde inte hämta målgrupper");
            }
        }
        loadSubgroups();
    }, []);

    // Image Upload State
    const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
    const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null);
    const [iconImage, setIconImage] = useState<File | null>(null);
    const [iconImagePreview, setIconImagePreview] = useState<string | null>(null);

    const backgroundInputRef = useRef<HTMLInputElement>(null);
    const iconInputRef = useRef<HTMLInputElement>(null);

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBackgroundImage(file);
            setBackgroundImagePreview(URL.createObjectURL(file));
        }
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIconImage(file);
            setIconImagePreview(URL.createObjectURL(file));
        }
    };

    function startEditing(type: any) {
        setEditingId(type.id);

        // Populate form state
        setCardColor(type.card_design?.color || CARD_COLORS[0].value);
        setCardIcon(type.card_design?.icon || "User");
        setRequiresVerified(type.requires_verified_profile || false);
        setTargetSubgroups(type.target_subgroups || []);

        // Set previews if URLs exist
        if (type.card_design?.background_url) {
            setBackgroundImagePreview(type.card_design.background_url);
        } else {
            setBackgroundImagePreview(null);
        }

        if (type.card_design?.icon_url) {
            setIconImagePreview(type.card_design.icon_url);
        } else {
            setIconImagePreview(null);
        }

        // Reset file inputs
        setBackgroundImage(null);
        setIconImage(null);

        // Populate form fields manually since we're using uncontrolled inputs mostly
        if (formRef.current) {
            const form = formRef.current;
            (form.elements.namedItem("name") as HTMLInputElement).value = type.name || "";
            (form.elements.namedItem("description") as HTMLTextAreaElement).value = type.description || "";
            (form.elements.namedItem("price") as HTMLInputElement).value = type.price || 0;
            (form.elements.namedItem("start_date") as HTMLInputElement).value = type.start_date ? type.start_date.split('T')[0] : "";
            (form.elements.namedItem("end_date") as HTMLInputElement).value = type.end_date ? type.end_date.split('T')[0] : "";
            (form.elements.namedItem("min_age") as HTMLInputElement).value = type.min_age || "";
            (form.elements.namedItem("max_age") as HTMLInputElement).value = type.max_age || "";
            (form.elements.namedItem("approval_flow") as HTMLSelectElement).value = type.approval_flow || "AUTO";
        }
    }

    function cancelEditing() {
        setEditingId(null);
        resetForm();
    }

    function resetForm() {
        setCardColor(CARD_COLORS[0].value);
        setCardIcon("User");
        setRequiresVerified(false);
        setTargetSubgroups([]);
        setBackgroundImage(null);
        setBackgroundImagePreview(null);
        setIconImage(null);
        setIconImagePreview(null);
        if (formRef.current) formRef.current.reset();
    }

    async function handleSubmit(formData: FormData) {
        if (isReadOnly) return;
        setIsPending(true);
        try {
            let backgroundUrl = backgroundImagePreview; // Default to existing URL if preview is set
            let iconUrl = iconImagePreview;

            // If new files selected, upload them
            if (backgroundImage) {
                backgroundUrl = await uploadImage(backgroundImage, 'public_images', 'membership-cards');
            }

            if (iconImage) {
                iconUrl = await uploadImage(iconImage, 'public_images', 'membership-icons');
            }

            const data = {
                name: formData.get("name"),
                description: formData.get("description"),
                price: Number(formData.get("price")),
                start_date: formData.get("start_date"),
                end_date: formData.get("end_date"),
                min_age: Number(formData.get("min_age")) || null,
                max_age: Number(formData.get("max_age")) || null,
                target_subgroups: targetSubgroups,
                approval_flow: formData.get("approval_flow"),
                requires_verified_profile: requiresVerified,
                card_design: {
                    color: cardColor,
                    icon: cardIcon,
                    pattern: "none",
                    background_url: backgroundUrl,
                    icon_url: iconUrl
                }
            };

            let result;
            if (editingId) {
                result = await updateMembershipType(editingId, data);
            } else {
                result = await createMembershipType(data);
            }

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(editingId ? "Period uppdaterad" : "Medlemskapsperiod skapad");
                cancelEditing(); // This resets the form and editing state
            }
        } catch (error) {
            console.error(error);
            toast.error("Ett fel uppstod");
        } finally {
            setIsPending(false);
        }
    }

    async function confirmDelete() {
        if (!selectedIdToDelete || isReadOnly) return;

        setIsPending(true);
        try {
            const result = await deleteMembershipType(selectedIdToDelete);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Period borttagen");
                setIsDeleteDialogOpen(false);
            }
        } catch (error) {
            toast.error("Ett fel uppstod");
        } finally {
            setIsPending(false);
            setSelectedIdToDelete(null);
        }
    }

    const SelectedIcon = CARD_ICONS.find(i => i.name === cardIcon)?.icon || User;

    return (
        <div className="space-y-8">
            {isReadOnly && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3 text-slate-600">
                    <Lock className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-slate-900">Endast läsläge</h3>
                        <p className="text-sm mt-1">
                            Du har inte behörighet att hantera medlemskap. Kontakta en administratör om något behöver ändras.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Create/Edit Section */}
                <div className="lg:col-span-7 space-y-6">
                    <div className={cn("bg-white p-6 rounded-2xl border border-slate-100 shadow-sm", isReadOnly && "opacity-60 pointer-events-none")}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Plus className="h-5 w-5 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingId ? "Redigera period" : "Skapa ny period"}
                                </h2>
                            </div>
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={cancelEditing}>
                                    Avbryt
                                </Button>
                            )}
                        </div>

                        <form ref={formRef} action={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Grundinformation</h3>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Namn</Label>
                                        <Input id="name" name="name" placeholder="T.ex. Medlemskap 2025" required disabled={isReadOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Beskrivning</Label>
                                        <Textarea id="description" name="description" placeholder="Vad ingår i medlemskapet?" disabled={isReadOnly} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Pris (kr)</Label>
                                            <Input id="price" name="price" type="number" defaultValue="0" min="0" disabled={isReadOnly} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="approval_flow">Godkännande</Label>
                                            <select
                                                id="approval_flow"
                                                name="approval_flow"
                                                disabled={isReadOnly}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="AUTO">Automatiskt</option>
                                                <option value="MANUAL">Manuell granskning</option>
                                                <option value="IN_PERSON">Kräver besök</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Dates & Eligibility */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Giltighet & Behörighet</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Startdatum</Label>
                                        <Input id="start_date" name="start_date" type="date" required disabled={isReadOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_date">Slutdatum</Label>
                                        <Input id="end_date" name="end_date" type="date" required disabled={isReadOnly} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="min_age">Min ålder</Label>
                                        <Input id="min_age" name="min_age" type="number" min="0" max="100" placeholder="Ingen gräns" disabled={isReadOnly} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="max_age">Max ålder</Label>
                                        <Input id="max_age" name="max_age" type="number" min="0" max="100" placeholder="Ingen gräns" disabled={isReadOnly} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Målgrupper</Label>
                                    <MultiSelect
                                        options={availableSubgroups}
                                        selected={targetSubgroups}
                                        onChange={setTargetSubgroups}
                                        placeholder="Välj målgrupper..."
                                        searchPlaceholder="Sök målgrupper..."
                                        disabled={isReadOnly}
                                        onCreateNew={() => {
                                            if (isReadOnly) return;
                                            // Disabled creation of new subgroups from here for now as it requires DB insert
                                            toast.info("Kontakta admin för att lägga till nya målgrupper");
                                        }}
                                        createNewLabel="Skapa ny målgrupp"
                                    />
                                </div>
                                <div className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                                    requiresVerified
                                        ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                        : "bg-slate-50 border-slate-100"
                                )}>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className={cn("w-4 h-4", requiresVerified ? "text-indigo-600" : "text-slate-400")} />
                                            <Label className={cn("text-base font-medium cursor-pointer", requiresVerified ? "text-indigo-900" : "text-slate-700")} htmlFor="verified-switch">
                                                Kräv verifierad profil
                                            </Label>
                                        </div>
                                        <p className={cn("text-xs", requiresVerified ? "text-indigo-600/80" : "text-slate-500")}>
                                            Endast användare med BankID-verifiering kan ansöka om detta medlemskap
                                        </p>
                                    </div>
                                    <Switch
                                        id="verified-switch"
                                        checked={requiresVerified}
                                        onCheckedChange={setRequiresVerified}
                                        disabled={isReadOnly}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Card Design */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Kortdesign</h3>

                                {/* Background Image Upload */}
                                <div className="space-y-3">
                                    <Label>Bakgrundsbild (Valfritt)</Label>
                                    <input
                                        type="file"
                                        ref={backgroundInputRef}
                                        onChange={handleBackgroundUpload}
                                        accept="image/*"
                                        className="hidden"
                                        disabled={isReadOnly}
                                    />
                                    <div className="flex gap-4">
                                        <div
                                            onClick={() => !isReadOnly && backgroundInputRef.current?.click()}
                                            className={cn("flex-1 h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-all group", isReadOnly && "cursor-not-allowed hover:bg-transparent hover:border-slate-200")}
                                        >
                                            {backgroundImagePreview ? (
                                                <div className="relative w-full h-full rounded-lg overflow-hidden">
                                                    <Image src={backgroundImagePreview} alt="Preview" fill className="object-cover" />
                                                    {!isReadOnly && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-white text-xs font-medium">Byt bild</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-400" />
                                                    <span className="text-xs text-slate-500 font-medium">Ladda upp bakgrund</span>
                                                </>
                                            )}
                                        </div>
                                        {backgroundImagePreview && !isReadOnly && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-full w-12 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                onClick={() => {
                                                    setBackgroundImage(null);
                                                    setBackgroundImagePreview(null);
                                                    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Custom Icon Upload */}
                                <div className="space-y-3">
                                    <Label>Egen Ikon / Logotyp (Valfritt)</Label>
                                    <input
                                        type="file"
                                        ref={iconInputRef}
                                        onChange={handleIconUpload}
                                        accept="image/*"
                                        className="hidden"
                                        disabled={isReadOnly}
                                    />
                                    <div className="flex gap-4">
                                        <div
                                            onClick={() => !isReadOnly && iconInputRef.current?.click()}
                                            className={cn("w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-all group", isReadOnly && "cursor-not-allowed hover:bg-transparent hover:border-slate-200")}
                                        >
                                            {iconImagePreview ? (
                                                <div className="relative w-full h-full rounded-lg overflow-hidden p-4">
                                                    <Image src={iconImagePreview} alt="Icon Preview" fill className="object-contain" />
                                                    {!isReadOnly && (
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-white text-xs font-medium">Byt</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-slate-300 mb-2 group-hover:text-indigo-400" />
                                                    <span className="text-xs text-slate-500 font-medium">Ladda upp</span>
                                                </>
                                            )}
                                        </div>
                                        {iconImagePreview && !isReadOnly && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-32 w-12 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                onClick={() => {
                                                    setIconImage(null);
                                                    setIconImagePreview(null);
                                                    if (iconInputRef.current) iconInputRef.current.value = '';
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label>Färgtema</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {CARD_COLORS.map((color) => (
                                            <button
                                                key={color.name}
                                                type="button"
                                                disabled={isReadOnly}
                                                onClick={() => setCardColor(color.value)}
                                                className={cn(
                                                    "w-8 h-8 rounded-full bg-gradient-to-br ring-2 ring-offset-2 transition-all",
                                                    color.value,
                                                    cardColor === color.value ? "ring-slate-900 scale-110" : "ring-transparent hover:scale-105",
                                                    isReadOnly && "cursor-not-allowed opacity-70 hover:scale-100"
                                                )}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label>Standardikon</Label>
                                    <div className="flex gap-2">
                                        {CARD_ICONS.map((item) => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                disabled={isReadOnly}
                                                onClick={() => {
                                                    setCardIcon(item.name);
                                                    // Clear custom icon if selecting standard
                                                    setIconImage(null);
                                                    setIconImagePreview(null);
                                                }}
                                                className={cn(
                                                    "p-2 rounded-lg border transition-all",
                                                    cardIcon === item.name && !iconImagePreview ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                                                    isReadOnly && "cursor-not-allowed opacity-70 hover:border-slate-200"
                                                )}
                                            >
                                                <item.icon className="h-5 w-5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={isPending || isReadOnly} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? "Uppdatera period" : "Skapa period"}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Preview & List Section */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Card Preview */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm sticky top-6">
                        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Förhandsgranskning</h3>
                        <div className={cn(
                            "aspect-[1.586] rounded-xl p-6 text-white shadow-lg relative overflow-hidden bg-gradient-to-br flex flex-col justify-between",
                            cardColor
                        )}>
                            {backgroundImagePreview && (
                                <>
                                    <Image src={backgroundImagePreview} alt="Background" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/30" />
                                </>
                            )}

                            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Medlemskort</p>
                                    <h3 className="text-2xl font-bold mt-1">Medlemskap 2025</h3>
                                </div>
                                {iconImagePreview ? (
                                    <div className="relative w-10 h-10">
                                        <Image src={iconImagePreview} alt="Icon" fill className="object-contain" />
                                    </div>
                                ) : (
                                    <SelectedIcon className="h-8 w-8 text-white/90" />
                                )}
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-white/60 text-xs">Innehavare</p>
                                        <p className="font-medium text-lg">Förnamn Efternamn</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/60 text-xs">Giltig t.o.m</p>
                                        <p className="font-medium">2025-12-31</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* List Existing */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 px-1">Befintliga perioder</h2>
                        {membershipTypes.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                                <p className="text-slate-500">Inga perioder skapade än.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {membershipTypes.map((type) => (
                                    <div key={type.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 gap-4 sm:gap-0">
                                        <div className="cursor-pointer flex-1" onClick={() => startEditing(type)}>
                                            <h3 className="font-semibold text-slate-900">{type.name || type.type}</h3>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                    {type.price > 0 ? `${type.price} kr` : "Gratis"}
                                                </span>
                                                {type.approval_flow !== 'AUTO' && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                        {type.approval_flow === 'MANUAL' ? 'Manuell' : 'Besök krävs'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center text-xs text-slate-500 mt-2">
                                                <CalendarIcon className="h-3 w-3 mr-1.5 text-indigo-500" />
                                                <span>
                                                    {format(new Date(type.start_date), "d MMM yyyy", { locale: sv })} -{" "}
                                                    {format(new Date(type.end_date), "d MMM yyyy", { locale: sv })}
                                                </span>
                                            </div>
                                        </div>
                                        {!isReadOnly && (
                                            <div className="flex justify-end sm:block gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => startEditing(type)}
                                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 mr-1"
                                                >
                                                    Redigera
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedIdToDelete(type.id);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Ta bort period
                        </DialogTitle>
                        <DialogDescription>
                            Är du säker på att du vill ta bort denna medlemskapsperiod? Detta går inte att ångra.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Avbryt</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ta bort
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

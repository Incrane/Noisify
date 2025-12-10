"use client";

import { useState, useRef, useEffect } from "react";
import { createMembershipType, deleteMembershipType, getPublicTargetSubgroups, updateMembershipType, type MembershipStats } from "@/app/staff/installningar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Trash2, Calendar as CalendarIcon, Plus, AlertCircle, CreditCard, Check, User, Users, ShieldCheck, Upload, X, Image as ImageIcon, Lock, Pencil } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePicker } from "@/components/ui/date-picker";
import { uploadImage } from "@/utils/supabase/storage";
import Image from "next/image";

interface MembershipSettingsFormProps {
    membershipTypes: any[];
    membershipStats: MembershipStats;
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

export default function MembershipSettingsForm({ membershipTypes, membershipStats, roleId }: MembershipSettingsFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active');
    const isReadOnly = roleId < 3;

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);
    const [cardIcon, setCardIcon] = useState("User");
    const [requiresVerified, setRequiresVerified] = useState(false);

    // Dates
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

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

    // Filter memberships by active/expired status
    const now = new Date();
    const activeMemberships = membershipTypes.filter(
        type => new Date(type.end_date) >= now
    );
    const expiredMemberships = membershipTypes.filter(
        type => new Date(type.end_date) < now
    );

    const displayedMemberships = activeTab === 'active' ? activeMemberships : expiredMemberships;

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

    function openCreateModal() {
        resetForm();
        setEditingId(null);
        setIsModalOpen(true);
    }

    function startEditing(type: any) {
        setEditingId(type.id);

        // Populate form state
        setCardColor(type.card_design?.color || CARD_COLORS[0].value);
        setCardIcon(type.card_design?.icon || "User");
        setRequiresVerified(type.requires_verified_profile || false);
        setTargetSubgroups(type.target_subgroups || []);
        setStartDate(type.start_date ? new Date(type.start_date) : undefined);
        setEndDate(type.end_date ? new Date(type.end_date) : undefined);

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
        setTimeout(() => {
            if (formRef.current) {
                const form = formRef.current;
                (form.elements.namedItem("name") as HTMLInputElement).value = type.name || "";
                (form.elements.namedItem("description") as HTMLTextAreaElement).value = type.description || "";
                (form.elements.namedItem("price") as HTMLInputElement).value = type.price || 0;
                (form.elements.namedItem("min_age") as HTMLInputElement).value = type.min_age || "";
                (form.elements.namedItem("max_age") as HTMLInputElement).value = type.max_age || "";
                (form.elements.namedItem("approval_flow") as HTMLSelectElement).value = type.approval_flow || "AUTO";
            }
        }, 0);

        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
        setEditingId(null);
        resetForm();
    }

    function resetForm() {
        setCardColor(CARD_COLORS[0].value);
        setCardIcon("User");
        setRequiresVerified(false);
        setTargetSubgroups([]);
        setStartDate(undefined);
        setEndDate(undefined);
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
            let backgroundUrl = backgroundImagePreview;
            let iconUrl = iconImagePreview;

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
                start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
                end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
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
                closeModal();
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

    // Form name for preview
    const [previewName, setPreviewName] = useState("Medlemskap 2025");

    return (
        <div className="space-y-6">
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

            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Medlemskapsperioder</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Hantera medlemskapstyper för din organisation
                    </p>
                </div>
                {!isReadOnly && (
                    <Button onClick={openCreateModal} className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Skapa ny period
                    </Button>
                )}
            </div>

            {/* Statistics Overview */}
            {(() => {
                const totalActive = Object.values(membershipStats).reduce((sum, s) => sum + s.active, 0);
                const totalPending = Object.values(membershipStats).reduce((sum, s) => sum + s.pending, 0);
                const totalMembers = Object.values(membershipStats).reduce((sum, s) => sum + s.total, 0);

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{totalMembers}</p>
                                    <p className="text-xs text-slate-500 font-medium">Totalt medlemmar</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Check className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{totalActive}</p>
                                    <p className="text-xs text-slate-500 font-medium">Aktiva medlemmar</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Loader2 className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{totalPending}</p>
                                    <p className="text-xs text-slate-500 font-medium">Väntande</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Active / Expired Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'expired')} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="active" className="relative">
                        Aktiva
                        {activeMemberships.length > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                                {activeMemberships.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="expired" className="relative">
                        Avslutade
                        {expiredMemberships.length > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                {expiredMemberships.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6">
                    {activeMemberships.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <CreditCard className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="font-medium text-slate-900 mb-1">Inga aktiva perioder</h3>
                            <p className="text-slate-500 text-sm mb-4">Skapa en ny medlemskapsperiod för att komma igång.</p>
                            {!isReadOnly && (
                                <Button onClick={openCreateModal} variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Skapa ny period
                                </Button>
                            )}
                        </div>
                    ) : (
                        <MembershipCardGrid
                            memberships={activeMemberships}
                            membershipStats={membershipStats}
                            onEdit={startEditing}
                            onDelete={(id) => { setSelectedIdToDelete(id); setIsDeleteDialogOpen(true); }}
                            isReadOnly={isReadOnly}
                            isActive={true}
                        />
                    )}
                </TabsContent>

                <TabsContent value="expired" className="mt-6">
                    {expiredMemberships.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
                            <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <CalendarIcon className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="font-medium text-slate-900 mb-1">Inga avslutade perioder</h3>
                            <p className="text-slate-500 text-sm">Tidigare medlemskapsperioder visas här.</p>
                        </div>
                    ) : (
                        <MembershipCardGrid
                            memberships={expiredMemberships}
                            membershipStats={membershipStats}
                            onEdit={startEditing}
                            onDelete={(id) => { setSelectedIdToDelete(id); setIsDeleteDialogOpen(true); }}
                            isReadOnly={isReadOnly}
                            isActive={false}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Create/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingId ? (
                                <>
                                    <Pencil className="h-5 w-5 text-indigo-600" />
                                    Redigera period
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5 text-indigo-600" />
                                    Skapa ny period
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId ? "Uppdatera medlemskapsperiodens inställningar." : "Fyll i uppgifterna för den nya medlemskapsperioden."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 lg:grid-cols-12 mt-4">
                        {/* Form Section */}
                        <div className="lg:col-span-7 space-y-6">
                            <form ref={formRef} action={handleSubmit} className="space-y-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Grundinformation</h3>
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Namn</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="T.ex. Medlemskap 2025"
                                                required
                                                disabled={isReadOnly}
                                                onChange={(e) => setPreviewName(e.target.value || "Medlemskap 2025")}
                                            />
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
                                            <DatePicker
                                                date={startDate}
                                                setDate={setStartDate}
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="end_date">Slutdatum</Label>
                                            <DatePicker
                                                date={endDate}
                                                setDate={setEndDate}
                                                disabled={isReadOnly}
                                            />
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
                                                Endast användare med verifierad profil kan ansöka om detta medlemskap
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
                                                className={cn("flex-1 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-all group", isReadOnly && "cursor-not-allowed hover:bg-transparent hover:border-slate-200")}
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
                                                        <ImageIcon className="w-6 h-6 text-slate-300 mb-1 group-hover:text-indigo-400" />
                                                        <span className="text-xs text-slate-500 font-medium">Ladda upp bakgrund</span>
                                                    </>
                                                )}
                                            </div>
                                            {backgroundImagePreview && !isReadOnly && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-24 w-12 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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

                                    <div className="grid grid-cols-2 gap-4">
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
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Avbryt
                                    </Button>
                                    <Button type="submit" disabled={isPending || isReadOnly} className="bg-indigo-600 hover:bg-indigo-700">
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingId ? "Uppdatera period" : "Skapa period"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:col-span-5">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Förhandsgranskning</h4>
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
                                            <h3 className="text-xl font-bold mt-1">{previewName}</h3>
                                        </div>
                                        {iconImagePreview ? (
                                            <div className="relative w-8 h-8">
                                                <Image src={iconImagePreview} alt="Icon" fill className="object-contain" />
                                            </div>
                                        ) : (
                                            <SelectedIcon className="h-7 w-7 text-white/90" />
                                        )}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-white/60 text-xs">Innehavare</p>
                                                <p className="font-medium">Förnamn Efternamn</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white/60 text-xs">Giltig t.o.m</p>
                                                <p className="font-medium text-sm">{endDate ? format(endDate, 'yyyy-MM-dd') : '2025-12-31'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
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

// Membership Card Grid Component
function MembershipCardGrid({
    memberships,
    membershipStats,
    onEdit,
    onDelete,
    isReadOnly,
    isActive
}: {
    memberships: any[],
    membershipStats: MembershipStats,
    onEdit: (type: any) => void,
    onDelete: (id: string) => void,
    isReadOnly: boolean,
    isActive: boolean
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map((type) => {
                const CardIcon = CARD_ICONS.find(i => i.name === type.card_design?.icon)?.icon || User;

                return (
                    <div
                        key={type.id}
                        className={cn(
                            "group relative bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200",
                            isActive ? "border-slate-100 hover:border-indigo-100" : "border-slate-100 opacity-75"
                        )}
                    >
                        {/* Mini Card Preview */}
                        <div className={cn(
                            "h-20 relative overflow-hidden bg-gradient-to-br flex items-center justify-between p-4",
                            type.card_design?.color || "from-blue-500 to-indigo-600"
                        )}>
                            {type.card_design?.background_url && (
                                <>
                                    <Image
                                        src={type.card_design.background_url}
                                        alt=""
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20" />
                                </>
                            )}
                            <div className="relative z-10">
                                <p className="text-white/80 text-[10px] font-medium uppercase tracking-wider">Medlemskort</p>
                                <h3 className="text-white font-bold text-sm truncate max-w-[160px]">{type.name || type.type}</h3>
                            </div>
                            <div className="relative z-10">
                                {type.card_design?.icon_url ? (
                                    <div className="relative w-8 h-8">
                                        <Image src={type.card_design.icon_url} alt="" fill className="object-contain" />
                                    </div>
                                ) : (
                                    <CardIcon className="h-6 w-6 text-white/80" />
                                )}
                            </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-4 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                    {type.price > 0 ? `${type.price} kr` : "Gratis"}
                                </span>
                                {type.approval_flow !== 'AUTO' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                        {type.approval_flow === 'MANUAL' ? 'Manuell' : 'Besök krävs'}
                                    </span>
                                )}
                                {!isActive && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600">
                                        Avslutad
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center text-xs text-slate-500">
                                <CalendarIcon className="h-3 w-3 mr-1.5 text-indigo-500" />
                                <span>
                                    {format(new Date(type.start_date), "d MMM yyyy", { locale: sv })} –{" "}
                                    {format(new Date(type.end_date), "d MMM yyyy", { locale: sv })}
                                </span>
                            </div>

                            {/* Member count for this type */}
                            {membershipStats[type.id] && membershipStats[type.id].active > 0 && (
                                <div className="flex items-center text-xs text-emerald-600 font-medium">
                                    <Users className="h-3 w-3 mr-1.5" />
                                    <span>{membershipStats[type.id].active} aktiva medlemmar</span>
                                </div>
                            )}

                            {/* Eligibility info - only show if any exist */}
                            {(type.min_age || type.max_age || (type.target_subgroups && type.target_subgroups.length > 0) || type.requires_verified_profile) && (
                                <div className="pt-2 border-t border-slate-100 mt-2 space-y-1.5">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Behörighet</p>

                                    {/* Age range */}
                                    {(type.min_age || type.max_age) && (
                                        <div className="flex items-center text-xs text-slate-600">
                                            <User className="h-3 w-3 mr-1.5 text-slate-400" />
                                            <span>
                                                {type.min_age && type.max_age
                                                    ? `${type.min_age}–${type.max_age} år`
                                                    : type.min_age
                                                        ? `Minst ${type.min_age} år`
                                                        : `Max ${type.max_age} år`
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {/* Target subgroups */}
                                    {type.target_subgroups && type.target_subgroups.length > 0 && (
                                        <div className="flex items-start text-xs text-slate-600">
                                            <Users className="h-3 w-3 mr-1.5 mt-0.5 text-slate-400 flex-shrink-0" />
                                            <span className="text-slate-500">
                                                {type.target_subgroups.length} målgrupp{type.target_subgroups.length > 1 ? 'er' : ''}
                                            </span>
                                        </div>
                                    )}

                                    {/* Verified profile required */}
                                    {type.requires_verified_profile && (
                                        <div className="flex items-center text-xs text-indigo-600">
                                            <ShieldCheck className="h-3 w-3 mr-1.5" />
                                            <span>Kräver verifierad profil</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isReadOnly && (
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(type)}
                                        className="flex-1 text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200"
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                        Redigera
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => onDelete(type.id)}
                                        className="h-8 w-8 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

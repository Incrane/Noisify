"use client";

import { useState } from "react";
import { updateOrganizationInfo, uploadOrganizationCover } from "@/app/staff/installningar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, Building2, MapPin, Mail, Phone, Edit2, Image as ImageIcon, Globe, Instagram, Facebook, Linkedin, Twitter, Youtube, Twitch, Upload, Search, MoveVertical, SlidersHorizontal } from "lucide-react";
import UnsplashModal from "@/components/staff/unsplash-modal";

interface OrgInfoFormProps {
    organization: any;
    roleId: number;
    cities: any[];
}

export default function OrgInfoForm({ organization, roleId, cities }: OrgInfoFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [logoUrl, setLogoUrl] = useState(organization?.logo_url || "");
    const [coverUrl, setCoverUrl] = useState(organization?.cover_url || "");
    const [coverPosition, setCoverPosition] = useState(organization?.cover_position || 50);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [showUnsplash, setShowUnsplash] = useState(false);
    const [showFocusSlider, setShowFocusSlider] = useState(false);

    // Form state for controlled inputs (to ensure values are passed)
    const [cityId, setCityId] = useState(organization?.city_id || "");
    const [orgStatus, setOrgStatus] = useState(organization?.org_status || "pending");
    const [tier, setTier] = useState(organization?.tier || "FREE");

    // Check if user has permission to edit (Role 3+ usually, or owner)
    const canEdit = roleId >= 3;

    async function handleSubmit(formData: FormData) {
        if (!canEdit) return;
        setIsPending(true);
        try {
            // Append logo_url and cover_url to formData
            formData.append("logo_url", logoUrl);
            formData.append("cover_url", coverUrl);
            formData.append("cover_position", coverPosition.toString());

            // Ensure controlled values are appended if not present (though hidden inputs should handle this)
            if (!formData.get("city_id") && cityId) formData.append("city_id", cityId);
            if (!formData.get("org_status") && orgStatus) formData.append("org_status", orgStatus);
            if (!formData.get("tier") && tier) formData.append("tier", tier);

            // Handle social links
            const socialLinks = {
                instagram: formData.get("social_instagram"),
                facebook: formData.get("social_facebook"),
                website: formData.get("social_website"),
                tiktok: formData.get("social_tiktok"),
                linkedin: formData.get("social_linkedin"),
                pinterest: formData.get("social_pinterest"),
                reddit: formData.get("social_reddit"),
                snapchat: formData.get("social_snapchat"),
                whatsapp: formData.get("social_whatsapp"),
                youtube: formData.get("social_youtube"),
                twitter: formData.get("social_twitter"),
                threads: formData.get("social_threads"),
                discord: formData.get("social_discord"),
                twitch: formData.get("social_twitch"),
                custom: formData.get("social_custom"),
            };
            formData.append("social_links", JSON.stringify(socialLinks));

            const result = await updateOrganizationInfo(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Information uppdaterad");
                setIsEditing(false);
                setShowFocusSlider(false);
            }
        } catch (error) {
            toast.error("Ett fel uppstod");
        } finally {
            setIsPending(false);
        }
    }

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const { uploadOrganizationLogo } = await import("@/app/staff/installningar/actions");
            const result = await uploadOrganizationLogo(formData);

            if (result.error) {
                toast.error(result.error);
            } else if (result.url) {
                setLogoUrl(result.url);
                toast.success("Logotyp uppladdad");
            }
        } catch (error) {
            toast.error("Kunde inte ladda upp logotyp");
        } finally {
            setUploadingLogo(false);
        }
    }

    async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCover(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadOrganizationCover(formData);

            if (result.error) {
                toast.error(result.error);
            } else if (result.url) {
                setCoverUrl(result.url);
                toast.success("Omslagsbild uppladdad");
            }
        } catch (error) {
            toast.error("Kunde inte ladda upp omslagsbild");
        } finally {
            setUploadingCover(false);
        }
    }

    const handleUnsplashSelect = (url: string) => {
        setCoverUrl(url);
        setShowUnsplash(false);
    };

    if (!isEditing) {
        return (
            <div className="space-y-8">
                {/* Cover Image View */}
                <div className="h-80 w-full rounded-3xl bg-slate-100 overflow-hidden relative border border-slate-200 shadow-sm group">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            style={{ objectPosition: `center ${coverPosition}%` }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <ImageIcon className="w-16 h-16 text-slate-200" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="flex items-end gap-8">
                            <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl shrink-0 rotate-3 transition-transform group-hover:rotate-0 duration-300">
                                <div className="w-full h-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-12 h-12 text-slate-300" />
                                    )}
                                </div>
                            </div>
                            <div className="text-white mb-2 flex-1">
                                <h2 className="text-4xl font-bold tracking-tight text-shadow-sm">{organization?.org_namn || "Namn saknas"}</h2>
                                <p className="text-white/90 flex items-center gap-2 mt-2 text-lg font-medium">
                                    <MapPin className="w-5 h-5 text-indigo-400" />
                                    {organization?.adress || "Adress saknas"}, {cities.find(c => c.id === organization?.city_id)?.name || "Stad ej vald"}
                                </p>
                            </div>
                            {canEdit && (
                                <Button onClick={() => setIsEditing(true)} className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-lg rounded-full px-6">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Redigera profil
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <Card className="md:col-span-2 border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg">Om verksamheten</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Beskrivning</h3>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{organization?.org_description || "Ingen beskrivning angiven"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Status</h3>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${organization?.org_status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                        organization?.org_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                            'bg-rose-100 text-rose-800'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full mr-2 ${organization?.org_status === 'active' ? 'bg-emerald-500' :
                                            organization?.org_status === 'pending' ? 'bg-amber-500' :
                                                'bg-rose-500'
                                            }`} />
                                        {organization?.org_status === 'active' ? 'Aktiv' :
                                            organization?.org_status === 'pending' ? 'Väntande' : 'Inaktiv'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Prisplan</h3>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800 border border-slate-200">
                                        {organization?.tier || "FREE"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-8">
                        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg">Kontakt</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-post</p>
                                        <p className="text-slate-900 font-medium truncate" title={organization?.contact_email}>{organization?.contact_email || "Ej angiven"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefon</p>
                                        <p className="text-slate-900 font-medium">{organization?.contact_phone || "Ej angiven"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {organization?.social_links && Object.keys(organization.social_links).length > 0 && (
                            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                    <CardTitle className="text-lg">Sociala medier</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex flex-wrap gap-3">
                                        {Object.entries(organization.social_links).map(([key, value]) => {
                                            if (!value) return null;
                                            return (
                                                <a key={key} href={value as string} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all text-slate-500 border border-slate-100 hover:border-indigo-100 hover:scale-105">
                                                    {key === 'instagram' && <Instagram className="w-5 h-5" />}
                                                    {key === 'facebook' && <Facebook className="w-5 h-5" />}
                                                    {key === 'website' && <Globe className="w-5 h-5" />}
                                                    {key === 'twitter' && <Twitter className="w-5 h-5" />}
                                                    {key === 'youtube' && <Youtube className="w-5 h-5" />}
                                                    {key === 'twitch' && <Twitch className="w-5 h-5" />}
                                                    {key === 'linkedin' && <Linkedin className="w-5 h-5" />}
                                                    {!['instagram', 'facebook', 'website', 'twitter', 'youtube', 'twitch', 'linkedin'].includes(key) && <Globe className="w-5 h-5" />}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <form action={handleSubmit} className="space-y-8">
                {/* Hidden inputs for Select components to ensure data submission */}
                <input type="hidden" name="city_id" value={cityId} />
                <input type="hidden" name="org_status" value={orgStatus} />
                <input type="hidden" name="tier" value={tier} />

                {/* Cover Image Upload */}
                <div className="h-80 w-full bg-slate-100 relative group rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt="Cover"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `center ${coverPosition}%` }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <ImageIcon className="w-16 h-16 text-slate-200" />
                        </div>
                    )}

                    {/* Focus Slider Overlay - Horizontal for better usability */}
                    {coverUrl && showFocusSlider && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md p-4 rounded-2xl flex flex-col items-center gap-2 z-20 w-64 shadow-2xl border border-white/10">
                            <div className="flex items-center justify-between w-full text-white/90 text-xs font-medium mb-1">
                                <span>Topp</span>
                                <span>Justera vertikalt fokus</span>
                                <span>Botten</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={coverPosition}
                                onChange={(e) => setCoverPosition(Number(e.target.value))}
                                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                title="Justera fokus"
                            />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" className="rounded-full px-6 backdrop-blur-md bg-white/90 hover:bg-white">
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Ändra omslagsbild
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="w-48">
                                    <DropdownMenuItem onClick={() => document.getElementById('cover-upload')?.click()}>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Ladda upp egen
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setShowUnsplash(true)}>
                                        <Search className="w-4 h-4 mr-2" />
                                        Välj från Unsplash
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {coverUrl && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="rounded-full px-4 backdrop-blur-md bg-white/90 hover:bg-white"
                                    onClick={() => setShowFocusSlider(!showFocusSlider)}
                                >
                                    <MoveVertical className="w-4 h-4 mr-2" />
                                    Justera fokus
                                </Button>
                            )}
                        </div>
                        <input
                            id="cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverUpload}
                            disabled={uploadingCover}
                        />
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-8">
                        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg">Grundläggande information</CardTitle>
                                <CardDescription>Informationen som visas publikt för din verksamhet.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6">
                                {/* Logo Upload */}
                                <div className="flex items-start gap-6 pb-8 border-b border-slate-100">
                                    <div className="w-28 h-28 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group shrink-0 hover:border-indigo-300 transition-colors">
                                        {logoUrl ? (
                                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-400">
                                                <Building2 className="w-8 h-8 mb-2" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <label htmlFor="logo-upload" className="cursor-pointer text-white text-xs font-bold px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm">
                                                {uploadingLogo ? "..." : "Ändra"}
                                            </label>
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleLogoUpload}
                                                disabled={uploadingLogo}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900">Logotyp</h3>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                            Ladda upp en logotyp som representerar din verksamhet. Rekommenderat format är kvadratisk JPG eller PNG, minst 400x400px.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Verksamhetens namn *</Label>
                                        <Input id="name" name="name" defaultValue={organization?.org_namn || ""} required className="rounded-xl border-slate-200 focus:ring-indigo-500" />
                                        <p className="text-xs text-muted-foreground">Namnet som visas för medlemmar och i sökresultat.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Beskrivning</Label>
                                        <Textarea id="description" name="description" defaultValue={organization?.org_description || ""} rows={5} className="rounded-xl border-slate-200 focus:ring-indigo-500 resize-none" />
                                        <p className="text-xs text-muted-foreground">En kort beskrivning av verksamheten och vad ni erbjuder.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg">Plats & Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="address">Gatuadress *</Label>
                                    <Input id="address" name="address" defaultValue={organization?.adress || ""} required className="rounded-xl border-slate-200" />
                                    <p className="text-xs text-muted-foreground">Adressen där verksamheten bedrivs.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="city_id">Stad</Label>
                                        <Select value={cityId} onValueChange={setCityId}>
                                            <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                                                <SelectValue placeholder="Välj stad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cities.map((city) => (
                                                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">Staden där verksamheten ligger.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="org_status">Status</Label>
                                        <Select value={orgStatus} onValueChange={setOrgStatus}>
                                            <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                                                <SelectValue placeholder="Välj status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Aktiv</SelectItem>
                                                <SelectItem value="pending">Väntande</SelectItem>
                                                <SelectItem value="inactive">Inaktiv</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">Styr om verksamheten syns publikt.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tier">Prisplan</Label>
                                    <Select value={tier} onValueChange={setTier}>
                                        <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                                            <SelectValue placeholder="Välj plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FREE">Free</SelectItem>
                                            <SelectItem value="PRO">Pro</SelectItem>
                                            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Påverkar tillgängliga funktioner och gränser.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg">Kontaktuppgifter</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_email">E-post</Label>
                                    <Input id="contact_email" name="contact_email" type="email" defaultValue={organization?.contact_email || ""} className="rounded-xl border-slate-200" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone">Telefon</Label>
                                    <Input id="contact_phone" name="contact_phone" type="tel" defaultValue={organization?.contact_phone || ""} className="rounded-xl border-slate-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg">Sociala medier</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="social_instagram" className="text-xs flex items-center gap-2 text-slate-500 font-medium"><Instagram className="w-3.5 h-3.5" /> Instagram</Label>
                                    <Input id="social_instagram" name="social_instagram" defaultValue={organization?.social_links?.instagram || ""} placeholder="URL" className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_facebook" className="text-xs flex items-center gap-2 text-slate-500 font-medium"><Facebook className="w-3.5 h-3.5" /> Facebook</Label>
                                    <Input id="social_facebook" name="social_facebook" defaultValue={organization?.social_links?.facebook || ""} placeholder="URL" className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_tiktok" className="text-xs flex items-center gap-2 text-slate-500 font-medium">TikTok</Label>
                                    <Input id="social_tiktok" name="social_tiktok" defaultValue={organization?.social_links?.tiktok || ""} placeholder="URL" className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_youtube" className="text-xs flex items-center gap-2 text-slate-500 font-medium"><Youtube className="w-3.5 h-3.5" /> YouTube</Label>
                                    <Input id="social_youtube" name="social_youtube" defaultValue={organization?.social_links?.youtube || ""} placeholder="URL" className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_twitch" className="text-xs flex items-center gap-2 text-slate-500 font-medium"><Twitch className="w-3.5 h-3.5" /> Twitch</Label>
                                    <Input id="social_twitch" name="social_twitch" defaultValue={organization?.social_links?.twitch || ""} placeholder="URL" className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_discord" className="text-xs flex items-center gap-2 text-slate-500 font-medium">Discord</Label>
                                    <Input id="social_discord" name="social_discord" defaultValue={organization?.social_links?.discord || ""} placeholder="URL" className="rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="social_website" className="text-xs flex items-center gap-2 text-slate-500 font-medium"><Globe className="w-3.5 h-3.5" /> Hemsida</Label>
                                    <Input id="social_website" name="social_website" defaultValue={organization?.social_links?.website || ""} placeholder="URL" className="rounded-xl border-slate-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        disabled={isPending}
                        className="rounded-full px-6"
                    >
                        Avbryt
                    </Button>
                    <Button type="submit" disabled={isPending} className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Spara ändringar
                    </Button>
                </div>
            </form>

            <UnsplashModal
                isOpen={showUnsplash}
                onClose={() => setShowUnsplash(false)}
                onSelect={handleUnsplashSelect}
                orgId={organization.id}
            />
        </>
    );
}

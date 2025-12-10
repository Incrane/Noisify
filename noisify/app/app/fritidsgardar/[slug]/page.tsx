import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail, Phone, ArrowLeft } from "lucide-react";
import ActivityCard from "@/components/activity-card";
import MembershipButton from "@/components/membership/membership-button";
import RoomList from "./room-list";

export default async function YouthCenterDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const supabase = await createClient();
    const { slug } = await params;

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // 1. Get User Profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

    // 2. Get Organization - try by slug first, fall back to ID for backwards compatibility
    let org = null;

    console.log("Looking up organization with slug/id:", slug);

    // First try to find by slug
    const { data: orgBySlug, error: slugError } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    console.log("Slug lookup result:", { orgBySlug, slugError });

    if (orgBySlug) {
        org = orgBySlug;
    } else {
        // Fallback: try to find by ID (for backward compatibility with old links)
        const { data: orgById, error: idError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", slug)
            .maybeSingle();
        console.log("ID lookup result:", { orgById, idError });
        org = orgById;
    }

    if (!org) return <div>Fritidsgården hittades inte.</div>;

    // 3. Get Organization's Activities (use org.id)
    const { data: activities } = await supabase
        .from("v_member_activities")
        .select("*")
        .eq("activity_status", "PUBLISHED")
        .eq("organization_id", org.id)
        .gt("slut_datum_tid", new Date().toISOString())
        .order("start_datum_tid", { ascending: true });

    // 4. Get Rooms (use org.id)
    const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", org.id)
        .eq("status", "ACTIVE")
        .order("rum_namn");

    // 5. Get Membership Status (use org.id)
    let membership = null;
    if (profile) {
        const { data: memb } = await supabase
            .from("memberships")
            .select("*")
            .eq("profile_id", profile.id)
            .eq("org_id", org.id)
            .single();
        membership = memb;
    }

    // 6. Get Membership Types (use org.id)
    const { data: membershipTypes } = await supabase
        .from("org_membership_types")
        .select("*")
        .eq("org_id", org.id)
        .order("price", { ascending: true });

    const contact = org.kontakt as { epost?: string; phonenumber?: string };

    return (
        <div className="space-y-8">
            <Link
                href="/app/fritidsgardar"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka till fritidsgårdar
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-indigo-600 h-32 md:h-48 relative"></div>
                <div className="px-8 pb-8">
                    <div className="relative -top-12 md:-top-16 -mb-12 md:-mb-16 flex justify-between items-end">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1 shadow-md inline-block">
                            <div className="w-full h-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-100">
                                {org.logo_url ? (
                                    <Image src={org.logo_url} alt={org.org_namn} fill className="object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 font-bold text-3xl">
                                        {org.org_namn.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Membership Badge/Action */}
                        <div className="mb-16 md:mb-20">
                            <MembershipButton
                                orgId={org.id}
                                initialMembership={membership}
                                membershipTypes={membershipTypes || []}
                                profile={profile}
                            />
                        </div>
                    </div>

                    <div className="mt-16 md:mt-20">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{org.org_namn}</h1>
                        {org.adress && (
                            <div className="flex items-center gap-1 text-slate-500 mb-6">
                                <MapPin className="w-4 h-4" /> {org.adress}
                            </div>
                        )}

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2">
                                <h2 className="text-lg font-bold text-slate-900 mb-3">Om oss</h2>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {org.org_description || "Ingen beskrivning."}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit">
                                <h2 className="text-lg font-bold text-slate-900 mb-4">Kontakt</h2>
                                <div className="space-y-3">
                                    {contact?.epost && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Mail className="w-4 h-4" />
                                            <a href={`mailto:${contact.epost}`} className="hover:text-indigo-600">{contact.epost}</a>
                                        </div>
                                    )}
                                    {contact?.phonenumber && (
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Phone className="w-4 h-4" />
                                            <a href={`tel:${contact.phonenumber}`} className="hover:text-indigo-600">{contact.phonenumber}</a>
                                        </div>
                                    )}
                                    {!contact?.epost && !contact?.phonenumber && (
                                        <p className="text-slate-500 italic text-sm">Inga kontaktuppgifter.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Våra aktiviteter</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities?.map((activity) => (
                        <ActivityCard
                            key={activity.activity_id}
                            activity={activity}
                            href={`/app/aktiviteter/${activity.activity_id}`}
                        />
                    ))}
                    {activities?.length === 0 && (
                        <p className="text-slate-500 italic col-span-full">Inga publicerade aktiviteter just nu.</p>
                    )}
                </div>
            </div>

            {rooms && rooms.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Boka lokal</h2>
                    <RoomList rooms={rooms} orgId={org.id} />
                </div>
            )}
        </div>
    );
}

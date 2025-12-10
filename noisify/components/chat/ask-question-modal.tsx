'use client';

import { useState, useEffect } from 'react';
import { useChat } from './chat-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Building2 } from 'lucide-react';
import { createQuestionGroup } from '@/app/staff/chatt/actions';
import { createClient } from '@/utils/supabase/client';
import { cn } from '@/lib/utils';

interface AskQuestionModalProps {
    preSelectedOrgId?: string;
}

export function AskQuestionModal({ preSelectedOrgId }: AskQuestionModalProps) {
    const { setIsCreatingGroup, setActiveGroupId } = useChat();
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(preSelectedOrgId || null);
    const [myOrganizations, setMyOrganizations] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchMyOrgs = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('AskQuestionModal: No user found');
                return;
            }

            console.log('AskQuestionModal: User ID:', user.id);

            // Get profile first
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, alias')
                .eq('user_id', user.id)
                .single();

            if (profileError) {
                console.error('AskQuestionModal: Error fetching profile:', profileError);
            }

            if (!profile) {
                console.log('AskQuestionModal: No profile found for user:', user.id);
                return;
            }

            console.log('AskQuestionModal: Profile found:', profile);

            // Get memberships first
            const { data: memberships, error: membershipError } = await supabase
                .from('memberships')
                .select('org_id')
                .eq('profile_id', profile.id)
                .eq('membership_state', 'active');

            if (membershipError) {
                console.error('AskQuestionModal: Error fetching memberships:', membershipError);
                setIsLoading(false);
                return;
            }

            console.log('AskQuestionModal: Memberships found:', memberships);

            if (memberships && memberships.length > 0) {
                const orgIds = memberships.map((m: any) => m.org_id);

                // Fetch organizations details
                const { data: organizations, error: orgError } = await supabase
                    .from('organizations')
                    .select('id, org_namn')
                    .in('id', orgIds);

                if (orgError) {
                    console.error('AskQuestionModal: Error fetching organizations:', orgError);
                }

                if (organizations) {
                    const orgs = organizations.map((org: any) => ({
                        id: org.id,
                        name: org.org_namn
                    }));

                    setMyOrganizations(orgs);

                    // If only one org, auto-select it
                    if (orgs.length === 1 && !preSelectedOrgId) {
                        setSelectedOrgId(orgs[0].id);
                    }
                }
            } else {
                setMyOrganizations([]);
            }
            setIsLoading(false);
        };

        fetchMyOrgs();
    }, [preSelectedOrgId]);

    const handleSubmit = async () => {
        if (!selectedOrgId) return toast.error('Välj en organisation');

        setIsSubmitting(true);
        try {
            const group = await createQuestionGroup(selectedOrgId);
            setActiveGroupId(group.id);
            setIsCreatingGroup(false);
            toast.success('Fråga skapad');
            // Reload to show new group
            window.location.reload();
        } catch (error: any) {
            console.error('Error creating question group:', error);
            toast.error(error.message || 'Kunde inte skapa fråga');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCreatingGroup(false)}
                        className="rounded-full hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Ställ en fråga</h2>
                        <p className="text-sm text-slate-500">Välj organisation att kontakta</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full p-6 gap-8">
                <div className="space-y-4">
                    <Label className="text-base font-semibold text-slate-900">Vilken organisation vill du fråga?</Label>

                    {isLoading ? (
                        <div className="text-slate-500">Laddar organisationer...</div>
                    ) : myOrganizations.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-lg text-slate-600">
                            Du är inte medlem i några organisationer än.
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {myOrganizations.map(org => (
                                <button
                                    key={org.id}
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                                        selectedOrgId === org.id
                                            ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                                            : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center",
                                        selectedOrgId === org.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                                    )}>
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        "font-medium text-lg",
                                        selectedOrgId === org.id ? "text-indigo-900" : "text-slate-900"
                                    )}>
                                        {org.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedOrgId || isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                    >
                        {isSubmitting ? 'Skapar...' : 'Starta chatt'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

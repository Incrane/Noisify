'use client';
import { useState, useTransition } from 'react';
import { useChat } from './chat-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Settings, UserMinus, Ban, UserPlus, Clock, User, MoreHorizontal, Shield, Trash2, Activity } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { muteMember, unmuteMember } from '@/app/staff/chatt/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import MemberDetailsModal from '@/components/staff/member-details-modal';
import { getMemberByProfileId } from '@/app/staff/medlemmar/actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function GroupSettingsModal() {
    const { activeGroupId, groups, myRoles, refreshGroups, deleteGroup } = useChat();
    const [open, setOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newParticipants, setNewParticipants] = useState<string[]>([]);
    const [availableMembers, setAvailableMembers] = useState<{ name: string, id: string }[]>([]);

    // Member details modal state
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [isFetchingMember, startFetchTransition] = useTransition();

    const activeGroup = groups.find(g => g.id === activeGroupId);

    if (!activeGroup) return null;

    const roleInOrg = myRoles[activeGroup.org_id];
    const isStaff = roleInOrg >= 1;

    if (!isStaff) return null;

    const supabase = createClient();

    const handleRemove = async (profileId: string) => {
        try {
            const { error } = await supabase
                .from('chat_participants')
                .delete()
                .eq('group_id', activeGroup.id)
                .eq('profile_id', profileId);

            if (error) throw error;
            toast.success('Användare borttagen');
            await refreshGroups();
        } catch (e) {
            toast.error('Kunde inte ta bort användare');
        }
    };

    const handleBlock = async (profileId: string, isBlocked: boolean) => {
        try {
            const { error } = await supabase
                .from('chat_participants')
                .update({ is_blocked: !isBlocked })
                .eq('group_id', activeGroup.id)
                .eq('profile_id', profileId);

            if (error) throw error;
            toast.success(isBlocked ? 'Användare avblockerad' : 'Användare blockerad');
            await refreshGroups();
        } catch (e) {
            toast.error('Kunde inte uppdatera blockering');
        }
    };

    const handleUnmute = async (profileId: string) => {
        try {
            await unmuteMember(activeGroup.org_id, profileId);
            toast.success('Användare avmutad');
            await refreshGroups();
        } catch (e: any) {
            console.error(e);
            toast.error('Kunde inte avmuta användare');
        }
    };

    const handleMute = async (profileId: string, durationMinutes: number) => {
        try {
            await muteMember(activeGroup.org_id, profileId, durationMinutes);
            toast.success('Användare mutad');
            await refreshGroups();
        } catch (e: any) {
            console.error(e);
            toast.error('Kunde inte muta användare');
        }
    };

    const fetchAvailableMembers = async () => {
        setIsAdding(true);
        const currentMemberIds = activeGroup.participants.map(p => p.profile_id);

        const { data: memberIds } = await supabase
            .from('memberships')
            .select('profile_id')
            .eq('org_id', activeGroup.org_id);

        if (memberIds) {
            const allMemberIds = Array.from(new Set(memberIds.map(m => m.profile_id)));
            const potentialIds = allMemberIds.filter(id => !currentMemberIds.includes(id));

            if (potentialIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, alias')
                    .in('id', potentialIds);

                if (profiles) {
                    setAvailableMembers(profiles.map(p => ({ name: p.alias || 'Okänd', id: p.id })));
                }
            } else {
                setAvailableMembers([]);
            }
        }
    };

    const handleAddMembers = async () => {
        try {
            const participants = newParticipants.map(id => ({
                group_id: activeGroup.id,
                profile_id: id,
                role: 'member'
            }));

            const { error } = await supabase
                .from('chat_participants')
                .insert(participants);

            if (error) throw error;
            toast.success('Medlemmar tillagda');
            await refreshGroups();
            setIsAdding(false);
            setNewParticipants([]);
        } catch (e) {
            toast.error('Kunde inte lägga till medlemmar');
        }
    };

    const handleMemberClick = (profileId: string) => {
        startFetchTransition(async () => {
            try {
                const result = await getMemberByProfileId(activeGroup.org_id, profileId);
                if (result.success && result.member) {
                    setSelectedMember(result.member);
                    setDetailsOpen(true);
                } else {
                    toast.error(result.error || 'Kunde inte hämta medlemsuppgifter');
                }
            } catch (error) {
                console.error(error);
                toast.error('Ett fel uppstod');
            }
        });
    };

    const isMuted = (mutedUntil: string | null) => {
        if (!mutedUntil) return false;
        return new Date(mutedUntil) > new Date();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Hantera grupp: {activeGroup.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-medium">Deltagare</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                            {activeGroup.participants.map(p => {
                                const memberIsMuted = isMuted(p.membership?.muted_until || null);
                                return (
                                    <div key={p.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg hover:bg-muted transition-colors group">
                                        <div
                                            className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden"
                                            onClick={() => handleMemberClick(p.profile_id)}
                                        >
                                            <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold
                                            ${p.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                                                {p.profile.alias?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm truncate">{p.profile.alias}</span>
                                                    {p.is_blocked && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium border border-red-200">
                                                            Blockerad
                                                        </span>
                                                    )}
                                                    {memberIsMuted && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-medium border border-amber-200">
                                                            Mutad
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{p.role === 'admin' ? 'Personal' : 'Medlem'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                            {p.role !== 'admin' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>

                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>
                                                                <Clock className="mr-2 h-4 w-4" />
                                                                {memberIsMuted ? 'Hantera mutning' : 'Muta medlem'}
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                {memberIsMuted && (
                                                                    <>
                                                                        <DropdownMenuItem onClick={() => handleUnmute(p.profile_id)}>
                                                                            Avmuta
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                    </>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleMute(p.profile_id, 60)}>
                                                                    1 timme
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleMute(p.profile_id, 1440)}>
                                                                    24 timmar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleMute(p.profile_id, 10080)}>
                                                                    1 vecka
                                                                </DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>

                                                        <DropdownMenuItem onClick={() => handleBlock(p.profile_id, p.is_blocked)}>
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            {p.is_blocked ? 'Avblockera' : 'Blockera'}
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleRemove(p.profile_id)}
                                                        >
                                                            <UserMinus className="mr-2 h-4 w-4" />
                                                            Ta bort från grupp
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        {!isAdding ? (
                            <div className="space-y-2">
                                <Button onClick={fetchAvailableMembers} variant="outline" className="w-full">
                                    <UserPlus className="mr-2 h-4 w-4" /> Lägg till deltagare
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            className="w-full"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Radera grupp
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Är du helt säker?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Detta kommer permanent radera gruppen och dess historik för alla deltagare.
                                                Detta går inte att ångra.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                                onClick={() => {
                                                    deleteGroup(activeGroup.id);
                                                    setOpen(false);
                                                }}
                                            >
                                                Radera grupp
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <MultiSelect
                                    options={availableMembers}
                                    selected={newParticipants}
                                    onChange={setNewParticipants}
                                    placeholder="Välj medlemmar..."
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleAddMembers} disabled={newParticipants.length === 0} className="flex-1">
                                        Lägg till
                                    </Button>
                                    <Button onClick={() => setIsAdding(false)} variant="ghost">
                                        Avbryt
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>

            {selectedMember && (
                <MemberDetailsModal
                    member={selectedMember}
                    orgId={activeGroup.org_id}
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                >
                    <div className="hidden"></div>
                </MemberDetailsModal>
            )}
        </Dialog>
    );
}

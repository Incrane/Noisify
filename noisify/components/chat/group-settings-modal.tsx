'use client';
import { useState } from 'react';
import { useChat } from './chat-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Settings, UserMinus, Ban, UserPlus } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';

export function GroupSettingsModal() {
    const { activeGroupId, groups, myRoles } = useChat();
    const [open, setOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newParticipants, setNewParticipants] = useState<string[]>([]);
    const [availableMembers, setAvailableMembers] = useState<{ name: string, id: string }[]>([]);

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
            window.location.reload();
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
            window.location.reload();
        } catch (e) {
            toast.error('Kunde inte uppdatera blockering');
        }
    };

    const fetchAvailableMembers = async () => {
        setIsAdding(true);
        // Fetch members of org who are NOT in the group
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
            window.location.reload();
        } catch (e) {
            toast.error('Kunde inte lägga till medlemmar');
        }
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
                            {activeGroup.participants.map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{p.profile.alias}</span>
                                        <span className="text-xs text-muted-foreground">{p.role}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant={p.is_blocked ? "destructive" : "ghost"}
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleBlock(p.profile_id, p.is_blocked)}
                                            title={p.is_blocked ? "Avblockera" : "Blockera"}
                                        >
                                            <Ban className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => handleRemove(p.profile_id)}
                                            title="Ta bort"
                                        >
                                            <UserMinus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        {!isAdding ? (
                            <Button onClick={fetchAvailableMembers} variant="outline" className="w-full">
                                <UserPlus className="mr-2 h-4 w-4" /> Lägg till deltagare
                            </Button>
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
        </Dialog>
    );
}

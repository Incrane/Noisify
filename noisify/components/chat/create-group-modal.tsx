'use client';
import { useState, useEffect } from 'react';
import { useChat } from './chat-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { getChatEligibleMembers } from '@/app/staff/chatt/actions';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CreateGroupModalProps {
    orgId?: string;
}

export function CreateGroupModal({ orgId }: CreateGroupModalProps) {
    const { createGroup } = useChat();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [participants, setParticipants] = useState<string[]>([]);
    const [availableMembers, setAvailableMembers] = useState<{ name: string, id: string }[]>([]);

    useEffect(() => {
        if (!orgId) return;

        const fetchMembers = async () => {
            const members = await getChatEligibleMembers(orgId);
            setAvailableMembers(members);
        };

        fetchMembers();
    }, [orgId]);

    const handleSubmit = async () => {
        if (!orgId) return toast.error('Ingen organisation vald');
        if (participants.length === 0) return toast.error('Välj minst en deltagare');

        try {
            await createGroup(name, participants, orgId);
            setOpen(false);
            setName('');
            setParticipants([]);
            toast.success('Grupp skapad');
        } catch (e) {
            // Error handled in provider
        }
    };

    if (!orgId) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md">
                    <Plus className="w-4 h-4" />
                    Ny Grupp
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <Plus className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="space-y-1 text-left">
                            <DialogTitle className="text-xl font-semibold text-slate-900">Skapa ny chattgrupp</DialogTitle>
                            <p className="text-sm text-slate-500">
                                Starta en ny konversation med medlemmar i din organisation.
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Gruppnamn</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="T.ex. Fotbollslaget P-12"
                            className="h-11 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all"
                        />
                        <p className="text-xs text-slate-500">Ett beskrivande namn gör det lättare att hitta gruppen.</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Deltagare</Label>
                        <MultiSelect
                            options={availableMembers}
                            selected={participants}
                            onChange={setParticipants}
                            placeholder="Sök och välj medlemmar..."
                        />
                        <p className="text-xs text-slate-500">
                            {participants.length} {participants.length === 1 ? 'deltagare' : 'deltagare'} valda
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 bg-slate-50/50 border-t border-slate-100 gap-3 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                        Avbryt
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={participants.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-8 transition-all"
                    >
                        Skapa grupp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

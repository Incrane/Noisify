'use client';

import { useState, useEffect } from 'react';
import { useChat } from './chat-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getChatEligibleMembers } from '@/app/staff/chatt/actions';
import { toast } from 'sonner';
import { Search, Check, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateGroupViewProps {
    orgId?: string;
}

export function CreateGroupView({ orgId }: CreateGroupViewProps) {
    const { createGroup, setIsCreatingGroup } = useChat();
    const [name, setName] = useState('');
    const [participants, setParticipants] = useState<string[]>([]);
    const [availableMembers, setAvailableMembers] = useState<{ name: string, id: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const fetchMembers = async () => {
            setIsLoading(true);
            try {
                const members = await getChatEligibleMembers(orgId);
                setAvailableMembers(members);
            } catch (error) {
                console.error('Error fetching members:', error);
                toast.error('Kunde inte hämta medlemmar');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [orgId]);

    const handleSubmit = async () => {
        if (!orgId) return toast.error('Ingen organisation vald');
        if (participants.length === 0) return toast.error('Välj minst en deltagare');

        try {
            await createGroup(name, participants, orgId);
            setIsCreatingGroup(false);
            toast.success('Grupp skapad');
        } catch (e) {
            // Error handled in provider
        }
    };

    const toggleParticipant = (id: string) => {
        setParticipants(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const filteredMembers = availableMembers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <h2 className="text-xl font-bold text-slate-900">Ny chattgrupp</h2>
                        <p className="text-sm text-slate-500">Välj medlemmar att chatta med</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setIsCreatingGroup(false)}
                        className="text-slate-600"
                    >
                        Avbryt
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={participants.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]"
                    >
                        Skapa ({participants.length})
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full p-6 gap-8">

                {/* Group Name Input */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-900">Vad ska gruppen heta?</Label>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="T.ex. Fotbollslaget (Valfritt)"
                        className="h-12 text-lg px-4 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    />
                </div>

                {/* Member Selection */}
                <div className="flex-1 flex flex-col min-h-0 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold text-slate-900">Välj deltagare</Label>
                        <span className="text-sm text-slate-500">{participants.length} valda</span>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Sök efter medlemmar..."
                            className="pl-10 bg-slate-50 border-slate-200"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Laddar medlemmar...</div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Inga medlemmar hittades</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {filteredMembers.map(member => {
                                    const isSelected = participants.includes(member.id);
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => toggleParticipant(member.id)}
                                            className={cn(
                                                "flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-slate-50",
                                                isSelected && "bg-indigo-50/50 hover:bg-indigo-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                                    isSelected ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                                                )}>
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={cn("font-medium", isSelected ? "text-indigo-900" : "text-slate-900")}>
                                                        {member.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                                isSelected
                                                    ? "bg-indigo-600 border-indigo-600"
                                                    : "border-slate-300 bg-white"
                                            )}>
                                                {isSelected && <Check className="w-4 h-4 text-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

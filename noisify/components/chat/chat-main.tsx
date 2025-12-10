'use client';

import { useChat } from './chat-context';
import { ChatList } from './chat-list';
import { ChatWindow } from './chat-window';
import { CreateGroupView } from './create-group-view';
import { AskQuestionModal } from './ask-question-modal';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircleQuestion } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ChatMainProps {
    orgId?: string;
}

export function ChatMain({ orgId }: ChatMainProps) {
    const { isCreatingGroup, setIsCreatingGroup, activeGroupId } = useChat();
    const [isStaff, setIsStaff] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            if (!orgId) {
                // If no org context (e.g. member view), check if they are staff anywhere
                // For now, let's assume if they are in /app/chatt they are a member
                // But we can check if they have any staff roles
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('user_id', user.id)
                        .single();

                    if (profile) {
                        const { data: roles } = await supabase
                            .from('org_user')
                            .select('role_id')
                            .eq('profile_id', profile.id)
                            .gte('role_id', 2);

                        setIsStaff(roles && roles.length > 0 ? true : false);
                    } else {
                        setIsStaff(false);
                    }
                }
            } else {
                // If in org context, check role for that org
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('user_id', user.id)
                        .single();

                    if (profile) {
                        const { data: role } = await supabase
                            .from('org_user')
                            .select('role_id')
                            .eq('org_id', orgId)
                            .eq('profile_id', profile.id)
                            .single();

                        setIsStaff(role && role.role_id >= 2 ? true : false);
                    } else {
                        setIsStaff(false);
                    }
                }
            }
            setIsLoading(false);
        };
        checkRole();
    }, [orgId]);

    if (isCreatingGroup) {
        return isStaff ? <CreateGroupView orgId={orgId} /> : <AskQuestionModal preSelectedOrgId={orgId} />;
    }

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-between shrink-0 px-4 md:px-0 pt-4 md:pt-0">
                <h1 className="text-2xl font-bold text-slate-900">Chatt</h1>
                {!isLoading && (
                    <Button
                        onClick={() => setIsCreatingGroup(true)}
                        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md ${activeGroupId ? 'hidden md:flex' : 'flex'}`}
                    >
                        {isStaff ? (
                            <>
                                <Plus className="w-4 h-4" />
                                <span className="hidden md:inline">Ny Grupp</span>
                                <span className="md:hidden">Ny</span>
                            </>
                        ) : (
                            <>
                                <MessageCircleQuestion className="w-4 h-4" />
                                <span className="hidden md:inline">Ställ fråga</span>
                                <span className="md:hidden">Fråga</span>
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm relative">
                <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col h-full absolute md:relative z-10 bg-white transition-transform duration-300 ${activeGroupId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
                    <ChatList />
                </div>
                <div className={`flex-1 flex flex-col h-full absolute md:relative w-full transition-transform duration-300 ${activeGroupId ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                    <ChatWindow />
                </div>
            </div>
        </div>
    );
}

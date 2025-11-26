'use client';

import { useChat } from './chat-provider';
import { ChatList } from './chat-list';
import { ChatWindow } from './chat-window';
import { CreateGroupView } from './create-group-view';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ChatMainProps {
    orgId?: string;
}

export function ChatMain({ orgId }: ChatMainProps) {
    const { isCreatingGroup, setIsCreatingGroup, activeGroupId } = useChat();

    if (isCreatingGroup) {
        return <CreateGroupView orgId={orgId} />;
    }

    return (
        <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-300">
            <div className="flex items-center justify-between shrink-0 px-4 md:px-0 pt-4 md:pt-0">
                <h1 className="text-2xl font-bold text-slate-900">Chatt</h1>
                <Button
                    onClick={() => setIsCreatingGroup(true)}
                    className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md ${activeGroupId ? 'hidden md:flex' : 'flex'}`}
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">Ny Grupp</span>
                    <span className="md:hidden">Ny</span>
                </Button>
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

'use client';
import { useChat } from './chat-provider';
import { MessageInput } from './message-input';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { GroupSettingsModal } from './group-settings-modal';
import { MessageCircle, ArrowLeft } from 'lucide-react';

export function ChatWindow() {
    const { activeGroupId, messages, groups, setActiveGroupId } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const activeGroup = groups.find(g => g.id === activeGroupId);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                supabase.from('profiles').select('id').eq('user_id', data.user.id).single()
                    .then(({ data: profile }) => {
                        if (profile) setCurrentUserId(profile.id);
                    });
            }
        });
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!activeGroupId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-full">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <MessageCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium">Välj en chatt för att börja</p>
                <p className="text-slate-400 text-sm">Eller skapa en ny grupp</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-4 md:px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setActiveGroupId(null)}
                        className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="font-bold text-slate-900 text-lg truncate max-w-[200px]">{activeGroup?.name || 'Grupp'}</h2>
                        <div className="text-sm text-slate-500 truncate max-w-[200px]">
                            {activeGroup?.participants.map(p => p.profile.alias).join(', ')}
                        </div>
                    </div>
                </div>
                <GroupSettingsModal />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 bg-slate-50" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-slate-400 text-sm">Inga meddelanden än. Säg hej! 👋</p>
                    </div>
                )}
                {messages.map((msg: any) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] md:max-w-[70%] shadow-sm ${isMe
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-900 border border-slate-200'
                                }`}>
                                {!isMe && <div className="text-xs font-medium text-indigo-600 mb-1">{msg.sender?.alias || 'Okänd'}</div>}
                                <div className="text-sm leading-relaxed break-words">{msg.content}</div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 px-1">
                                {new Date(msg.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="px-4 md:px-6 py-4 border-t border-slate-200 bg-white sticky bottom-0">
                <MessageInput />
            </div>
        </div>
    );
}

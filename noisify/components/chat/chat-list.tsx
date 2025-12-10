'use client';
import { useChat } from './chat-context';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

export function ChatList() {
    const { groups, activeGroupId, setActiveGroupId, isLoading } = useChat();

    if (isLoading) {
        return (
            <div className="w-80 border-r border-slate-200 bg-white p-4 flex flex-col gap-4">
                <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-80 border-r border-slate-200 bg-white flex flex-col h-full">

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => setActiveGroupId(group.id)}
                        className={cn(
                            "w-full p-3 text-left rounded-xl transition-all duration-200 flex flex-col gap-1 group",
                            activeGroupId === group.id
                                ? "bg-indigo-50 shadow-sm ring-1 ring-indigo-100"
                                : "hover:bg-slate-50"
                        )}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span className={cn(
                                "font-semibold truncate",
                                activeGroupId === group.id ? "text-indigo-900" : "text-slate-900"
                            )}>
                                {group.name || 'Namnlös grupp'}
                            </span>
                            {group.unreadCount ? (
                                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600 shrink-0" />
                            ) : null}
                            {/* Future: Time stamp */}
                        </div>
                        <div className={cn(
                            "text-xs truncate w-full",
                            activeGroupId === group.id ? "text-indigo-600/80" : "text-slate-500 group-hover:text-slate-600"
                        )}>
                            {group.participants.map(p => p.profile.alias).join(', ')}
                        </div>
                    </button>
                ))}

                {groups.length === 0 && (
                    <div className="text-center py-8 px-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageSquare className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm">Inga chattar än.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

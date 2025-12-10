'use client';

import { createContext, useContext } from 'react';
import { ChatGroupWithParticipants, ChatMessage } from '@/types/chat';

export type ChatContextType = {
    groups: ChatGroupWithParticipants[];
    activeGroupId: string | null;
    setActiveGroupId: (id: string | null) => void;
    messages: ChatMessage[];
    sendMessage: (content: string) => Promise<void>;
    isLoading: boolean;
    createGroup: (name: string | null, participantIds: string[], orgId: string) => Promise<void>;
    myRoles: Record<string, number>; // org_id -> role_id
    isCreatingGroup: boolean;
    setIsCreatingGroup: (value: boolean) => void;
    refreshGroups: () => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
};

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}

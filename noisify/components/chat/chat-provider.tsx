'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ChatGroupWithParticipants, ChatMessage, ChatParticipant } from '@/types/chat';
import { toast } from 'sonner';

type ChatContextType = {
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
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children, orgId }: { children: ReactNode; orgId?: string }) {
    const [groups, setGroups] = useState<ChatGroupWithParticipants[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myRoles, setMyRoles] = useState<Record<string, number>>({});
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const supabase = createClient();

    // Fetch groups on mount
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                let query = supabase
                    .from('chat_groups')
                    .select(`
            *,
            participants:chat_participants(
              *,
              profile:profiles(alias, image_url)
            )
          `)
                    .order('created_at', { ascending: false });

                if (orgId) {
                    query = query.eq('org_id', orgId);
                }

                const { data, error } = await query;

                if (error) throw error;

                // Transform data to match ChatGroupWithParticipants
                // Note: Supabase returns arrays for joined tables, but we need to ensure types match
                const typedData = data?.map(g => ({
                    ...g,
                    participants: g.participants as any // Type assertion needed due to manual types
                })) as ChatGroupWithParticipants[];

                setGroups(typedData || []);

                // Fetch roles
                const { data: roles } = await supabase
                    .from('org_user')
                    .select('org_id, role_id')
                    .eq('user_id', user.id);

                const rolesMap: Record<string, number> = {};
                roles?.forEach(r => {
                    rolesMap[r.org_id] = Number(r.role_id);
                });
                setMyRoles(rolesMap);

            } catch (error) {
                console.error('Error fetching chat groups:', error);
                toast.error('Kunde inte hämta chattgrupper');
            } finally {
                setIsLoading(false);
            }
        };

        fetchGroups();

        // Subscribe to new groups (optional, for now just fetch once)
        // Realtime for groups list is complex because of RLS and joins.
    }, [supabase, orgId]);

    // Fetch messages when active group changes
    useEffect(() => {
        if (!activeGroupId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*, sender:profiles(alias, image_url)')
                .eq('group_id', activeGroupId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
                toast.error('Kunde inte hämta meddelanden');
                return;
            }

            setMessages(data as any[]);

            // Mark as read
            await supabase.rpc('mark_chat_as_read', { p_group_id: activeGroupId });
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${activeGroupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `group_id=eq.${activeGroupId}`,
                },
                (payload) => {
                    const newMessage = payload.new as ChatMessage;
                    // Fetch sender details for the new message
                    const fetchSender = async () => {
                        const { data: sender } = await supabase
                            .from('profiles')
                            .select('alias, image_url')
                            .eq('id', newMessage.sender_id)
                            .single();

                        if (sender) {
                            setMessages((prev) => [...prev, { ...newMessage, sender }]);
                        }
                    };
                    fetchSender();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeGroupId, supabase]);

    const sendMessage = async (content: string) => {
        if (!activeGroupId) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get profile id
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    group_id: activeGroupId,
                    sender_id: profile.id,
                    content,
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Kunde inte skicka meddelande');
            throw error;
        }
    };

    const createGroup = async (name: string | null, participantIds: string[], targetOrgId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) throw new Error('Profile not found');

            // 1. Create Group
            const { data: group, error: groupError } = await supabase
                .from('chat_groups')
                .insert({
                    org_id: targetOrgId,
                    name,
                    created_by: profile.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Add Participants
            // Add creator as admin
            const participants = [
                { group_id: group.id, profile_id: profile.id, role: 'admin' },
                ...participantIds.map(id => ({ group_id: group.id, profile_id: id, role: 'member' }))
            ];

            const { error: participantsError } = await supabase
                .from('chat_participants')
                .insert(participants);

            if (participantsError) throw participantsError;

            // Refresh groups
            window.location.reload();

        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('Kunde inte skapa grupp');
            throw error;
        }
    };

    return (
        <ChatContext.Provider
            value={{
                groups,
                activeGroupId,
                setActiveGroupId,
                messages,
                sendMessage,
                isLoading,
                createGroup,
                myRoles,
                isCreatingGroup,
                setIsCreatingGroup
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}

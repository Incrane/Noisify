'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ChatGroupWithParticipants, ChatMessage } from '@/types/chat';
import { toast } from 'sonner';
import { ChatContext } from './chat-context';

export function ChatProvider({ children, orgId }: { children: ReactNode; orgId?: string }) {
    const [groups, setGroups] = useState<ChatGroupWithParticipants[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [myRoles, setMyRoles] = useState<Record<string, number>>({});
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const supabase = createClient();

    // Fetch groups function
    const refreshGroups = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            let query = supabase
                .from('chat_groups')
                .select(`
            *,
            participants:chat_participants(
              *,
              profile:profiles(alias, image_url)
            ),
            messages:chat_messages(
                content,
                created_at,
                sender_id
            )
          `)
                .order('created_at', { ascending: false })
                .order('created_at', { foreignTable: 'chat_messages', ascending: false })
                .limit(1, { foreignTable: 'chat_messages' });

            if (orgId) {
                query = query.eq('org_id', orgId);
            }

            // Filter out soft-deleted groups
            query = query.neq('is_active', false);

            const { data, error } = await query;

            if (error) throw error;

            if (error) throw error;

            let typedData: ChatGroupWithParticipants[] = [];

            // Fetch my profile first to calculate unread status
            const { data: myProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data && data.length > 0) {
                const allOrgIds = Array.from(new Set(data.map(g => g.org_id)));
                const allProfileIds = Array.from(new Set(data.flatMap(g => g.participants.map((p: any) => p.profile_id))));

                const { data: membershipData } = await supabase
                    .from('memberships')
                    .select('org_id, profile_id, muted_until')
                    .in('org_id', allOrgIds)
                    .in('profile_id', allProfileIds);

                typedData = data.map(g => {
                    const myParticipant = myProfile ? g.participants.find((p: any) => p.profile_id === myProfile.id) : null;
                    const lastMessage = g.messages?.[0];
                    const hasUnread = lastMessage && myParticipant && (!myParticipant.last_read_at || new Date(lastMessage.created_at) > new Date(myParticipant.last_read_at));

                    return {
                        ...g,
                        unreadCount: hasUnread ? 1 : 0,
                        participants: g.participants.map((p: any) => {
                            const membership = membershipData?.find(m => m.org_id === g.org_id && m.profile_id === p.profile_id);
                            return {
                                ...p,
                                membership: {
                                    muted_until: membership?.muted_until || null
                                }
                            };
                        })
                    };
                }) as ChatGroupWithParticipants[];
            }

            setGroups(typedData || []);

            // ... (roles fetching stays same)
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
            console.error('Error fetching chat groups:', JSON.stringify(error, null, 2));
            console.error('Raw error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshGroups();

        const channel = supabase
            .channel(`chat_updates:${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_groups',
                    filter: orgId ? `org_id=eq.${orgId}` : undefined
                },
                () => refreshGroups()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'chat_participants'
                },
                () => refreshGroups()
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                },
                () => refreshGroups()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId, supabase]);

    useEffect(() => {
        // Handle URL params for direct linking
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const groupId = params.get('groupId');
            if (groupId) {
                setActiveGroupId(groupId);
            }
        }
    }, []);

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

            // Mark as read immediately
            await supabase.rpc('mark_chat_as_read', { p_group_id: activeGroupId });
            // Dispatch custom event to notify sidebar to refresh unread count
            window.dispatchEvent(new CustomEvent('chat-read'));
            // Refresh groups to clear badge locally if needed (optional but good)
            refreshGroups();
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
                async (payload) => { // Async to await rpc
                    const newMessage = payload.new as ChatMessage;

                    // Mark read immediately since we are active
                    // We don't await this blocking the UI update though
                    supabase.rpc('mark_chat_as_read', { p_group_id: activeGroupId }).then(() => {
                        // Dispatch custom event to notify sidebar to refresh unread count
                        window.dispatchEvent(new CustomEvent('chat-read'));
                    });

                    // Fetch sender details
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

            // Check if user is muted
            const group = groups.find(g => g.id === activeGroupId);
            const participant = group?.participants.find((p: any) => p.profile_id === profile.id);

            if (participant?.is_blocked) {
                toast.error('Du är blockerad från denna grupp och kan inte skicka meddelanden.');
                return;
            }

            if (participant?.membership?.muted_until) {
                const mutedUntil = new Date(participant.membership.muted_until);
                if (mutedUntil > new Date()) {
                    toast.error(`Du är mutad till ${mutedUntil.toLocaleString()} och kan inte skicka meddelanden.`);
                    return;
                }
            }

            const { error } = await supabase
                .from('chat_messages')
                .insert({
                    group_id: activeGroupId,
                    sender_id: profile.id,
                    content,
                });

            if (error) throw error;
        } catch (error: any) {
            console.error('Error sending message:', error);

            // Format friendly error message
            let errorMessage = 'Kunde inte skicka meddelande';

            if (error?.message?.includes('row-level security policy')) {
                errorMessage = 'Du saknar behörighet att skicka meddelanden i denna grupp';
            } else if (error?.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
            throw error;
        }
    };

    const createGroup = async (name: string | null, participantIds: string[], targetOrgId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (profileError) throw profileError;
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

            if (groupError) {
                console.error('Error inserting group:', groupError);
                throw groupError;
            }

            // 2. Add Participants
            // Add creator as admin
            // Ensure creator is not in participantIds to avoid duplicates
            const uniqueParticipantIds = participantIds.filter(id => id !== profile.id);

            const participants = [
                { group_id: group.id, profile_id: profile.id, role: 'admin' },
                ...uniqueParticipantIds.map(id => ({ group_id: group.id, profile_id: id, role: 'member' }))
            ];

            const { error: participantsError } = await supabase
                .from('chat_participants')
                .insert(participants);

            if (participantsError) {
                console.error('Error adding participants:', participantsError);
                throw participantsError;
            }

            // Refresh groups
            await refreshGroups();

        } catch (error) {
            console.error('Error creating group:', JSON.stringify(error, null, 2));
            toast.error('Kunde inte skapa grupp');
            throw error;
        }
    };

    const deleteGroup = async (groupId: string) => {
        try {
            const { error } = await supabase.rpc('soft_delete_chat_group', { p_group_id: groupId });

            if (error) throw error;

            toast.success('Gruppen har raderats');

            if (activeGroupId === groupId) {
                setActiveGroupId(null);
            }

            await refreshGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Kunde inte radera grupp');
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
                setIsCreatingGroup,
                refreshGroups,
                deleteGroup
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

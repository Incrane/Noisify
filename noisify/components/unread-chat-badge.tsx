'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function UnreadChatBadge({ className }: { className?: string }) {
    const [count, setCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        let channel: any;

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get profile id to filter participant updates
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!profile) return;

            const fetchCount = async () => {
                const { data } = await supabase.rpc('get_unread_chat_count');
                if (typeof data === 'number') setCount(data);
            };

            // Initial fetch
            fetchCount();

            // Subscribe to real-time changes
            channel = supabase.channel(`unread_badge:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'chat_messages'
                    },
                    () => {
                        // New message anywhere
                        fetchCount();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'chat_participants',
                        filter: `profile_id=eq.${profile.id}`
                    },
                    (payload) => {
                        // My read status changed
                        fetchCount();
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'chat_participants'
                    },
                    (payload) => {
                        // A catch-all for participant updates if the filtered one misses something
                        fetchCount();
                    }
                )
                .subscribe();
        };

        setupSubscription();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    if (count === 0) return null;

    return (
        <span className={`bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${className || ''}`}>
            {count}
        </span>
    );
}

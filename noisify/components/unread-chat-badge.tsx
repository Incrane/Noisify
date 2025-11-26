'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function UnreadChatBadge({ className }: { className?: string }) {
    const [count, setCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        const fetchCount = async () => {
            const { data } = await supabase.rpc('get_unread_chat_count');
            if (data) setCount(data);
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span className={`bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${className || ''}`}>
            {count}
        </span>
    );
}

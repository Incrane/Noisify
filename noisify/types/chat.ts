export type ChatGroup = {
    id: string;
    org_id: string;
    name: string | null;
    created_by: string;
    created_at: string;
    is_active: boolean;
};

export type ChatParticipant = {
    id: string;
    group_id: string;
    profile_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    is_blocked: boolean;
    membership?: {
        muted_until: string | null;
    };
};

export type ChatMessage = {
    id: string;
    group_id: string;
    sender_id: string;
    content: string;
    created_at: string;
};

export type ChatGroupWithParticipants = ChatGroup & {
    participants: (ChatParticipant & {
        profile: {
            alias: string | null;
            image_url: string | null;
            email?: string | null;
        };
        membership?: {
            muted_until: string | null;
        };
    })[];
    messages?: {
        created_at: string;
        content: string;
        sender_id: string;
    }[];
    unreadCount?: number;
    last_message?: ChatMessage;
};

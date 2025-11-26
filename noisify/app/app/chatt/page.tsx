import { ChatProvider } from '@/components/chat/chat-provider';
import { ChatMain } from '@/components/chat/chat-main';

export default function ChatPage() {
    return (
        <ChatProvider>
            <ChatMain />
        </ChatProvider>
    );
}

'use client';
import { useState } from 'react';
import { useChat } from './chat-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export function MessageInput() {
    const { sendMessage } = useChat();
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(content);
            setContent('');
        } catch (error) {
            // Error is already handled/toasted in chat-provider
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                className="flex-1 border-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Skriv ett meddelande..."
                disabled={isSending}
            />
            <Button
                type="submit"
                disabled={isSending || !content.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
            >
                <Send className="w-4 h-4" />
            </Button>
        </form>
    );
}

import { ChatProvider } from '@/components/chat/chat-provider';
import { ChatMain } from '@/components/chat/chat-main';
import { getSelectedOrganization } from '../actions';

export default async function StaffChatPage() {
    const selectedOrgId = await getSelectedOrganization();

    return (
        <ChatProvider orgId={selectedOrgId}>
            <ChatMain orgId={selectedOrgId} />
        </ChatProvider>
    );
}

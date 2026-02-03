'use client';

import ToolCallingChatbot from '@/components/primitives/tool-calling';
import { SiteHeader } from '@/components/site-header';

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col">
      <SiteHeader title="AI Chat" />
      <div className="flex-1 overflow-hidden">
        <ToolCallingChatbot apiEndpoint="/api/chat" />
      </div>
    </div>
  );
}

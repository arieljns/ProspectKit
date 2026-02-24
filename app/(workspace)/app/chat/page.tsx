"use client";

import ToolCallingChatbot from "@/components/workspace/chat/tool-calling";
import { SiteHeader } from "@/components/workspace/layout/site-header";

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

'use client';

import ToolCallingChatbot from '@/components/primitives/tool-calling';

export default function Chat() {
  return <ToolCallingChatbot apiEndpoint="/api/chat" />;
}

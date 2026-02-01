import ToolCallingChatbot from '@/components/primitives/tool-calling';

export default function Chat() {
  return (
    <ToolCallingChatbot
      apiEndpoint="/api/chat"
      suggestions={[
        'My favorite color is blue',
        'What is my favorite color?',
        "What's today's date?",
        'The capital of France is Paris',
      ]}
      placeholder="Ask anything or teach me something..."
    />
  );
}

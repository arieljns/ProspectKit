import { createResource } from '@/lib/actions/resources';
import { xai } from '@ai-sdk/xai';
import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: xai("grok-4-fast-non-reasoning-latest"),
    system: `You are a helpful assistant.
    Check your knowledge base if the user's question is related to themselves.
    When users ask about current events, news, or real-time information, use Live Search to get the latest data.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    providerOptions: {
      xai: {
        searchParameters: {
          mode: 'auto',
          returnCitations: true,
          maxSearchResults: 10,
        },
      },
    },
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe('the content or resource to add to the knowledge base'),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
      getInformation: tool({
        description: 'Get information from your knowledge base to answer questions. The knowledge base has been updated with user\'s personal information.',
        inputSchema: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
      getCurrentDate: tool({
        description: 'Get the current date and time with timezone information',
        inputSchema: z.object({}),
        execute: async () => {
          const now = new Date();
          return {
            timestamp: now.getTime(),
            iso: now.toISOString(),
            local: now.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZoneName: 'short',
            }),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utc: now.toUTCString(),
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

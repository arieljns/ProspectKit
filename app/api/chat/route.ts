import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/model";
import { findRelevantContent } from "@/lib/ai/embedding";
import { createResource } from "@/lib/server/services/resources/create-resource";
import { searchExa } from "@/lib/server/services/search/exa";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: getChatModel(),
    system: `You are a helpful assistant.
    Check your knowledge base if the user's question is related to themselves.
    When users ask about current events, news, or real-time information, use the searchWeb tool to get up-to-date data from the web.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      addResource: tool({
        description: `add a resource to your knowledge base.
          If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
        inputSchema: z.object({
          content: z
            .string()
            .describe("the content or resource to add to the knowledge base"),
        }),
        execute: async ({ content }) => createResource({ content }),
      }),
      getInformation: tool({
        description:
          "Get information from your knowledge base to answer questions. The knowledge base has been updated with user's personal information.",
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
      getCurrentDate: tool({
        description: "Get the current date and time with timezone information",
        inputSchema: z.object({}),
        execute: async () => {
          const now = new Date();
          return {
            timestamp: now.getTime(),
            iso: now.toISOString(),
            local: now.toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZoneName: "short",
            }),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utc: now.toUTCString(),
          };
        },
      }),
      searchWeb: tool({
        description:
          "Search the web for recent or external information that is not in the knowledge base.",
        inputSchema: z.object({
          query: z.string().describe("The web search query"),
          focus: z
            .enum(["general", "news", "company"])
            .optional()
            .describe("Optional search focus"),
          fresh: z
            .boolean()
            .optional()
            .describe("Whether to prefer freshly crawled results"),
        }),
        execute: async ({ query, focus, fresh }) => {
          const results = await searchExa({
            query,
            category:
              focus && focus !== "general"
                ? focus
                : undefined,
            numResults: 5,
            contents: {
              highlights: {
                maxCharacters: 1200,
                query,
              },
              maxAgeHours: fresh ? 0 : undefined,
            },
          });

          return {
            query,
            results: results.map((result) => ({
              title: result.title,
              url: result.url,
              publishedDate: result.publishedDate,
              highlights: result.highlights ?? [],
              summary: result.summary,
            })),
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}

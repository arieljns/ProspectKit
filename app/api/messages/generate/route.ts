import { generateOutreachMessage } from "@/lib/server/services/messages/generate-outreach-message";
import { toServiceTextErrorResponse } from "@/lib/server/http/error-response";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      contactId?: string;
      messageType?: string;
      feedback?: string;
    };

    const result = await generateOutreachMessage(body);
    if (result.ok) {
      return result.data.stream.toTextStreamResponse();
    }
    return toServiceTextErrorResponse(result.error);
  } catch (error) {
    console.error("Message generation error:", error);
    return toServiceTextErrorResponse({
      code: "UNKNOWN",
      message:
        error instanceof Error ? error.message : "Failed to generate message",
    });
  }
}

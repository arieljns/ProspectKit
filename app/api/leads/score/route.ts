import { scoreLeadForContact } from "@/lib/server/services/leads/score-lead-for-contact";
import { toServiceJsonErrorResponse } from "@/lib/server/http/error-response";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { contactId?: string };
    const result = await scoreLeadForContact({ contactId: body.contactId });

    if (result.ok) {
      return Response.json({
        success: true,
        data: result.data,
      });
    }
    return toServiceJsonErrorResponse(result.error);
  } catch (error) {
    console.error("Lead scoring error:", error);

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
    }

    return toServiceJsonErrorResponse({
      code: "UNKNOWN",
      message: error instanceof Error ? error.message : "Failed to score lead",
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}

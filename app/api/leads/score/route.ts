import { scoreLeadForContact } from "@/lib/server/services/leads/score-lead-for-contact";

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

    if (result.error.code === "INVALID_INPUT") {
      return Response.json(
        { success: false, error: result.error.message },
        { status: 400 },
      );
    }

    if (
      result.error.code === "CONTACT_NOT_FOUND" ||
      result.error.code === "CONTACT_COMPANY_NOT_FOUND" ||
      result.error.code === "SCORING_CONFIG_MISSING"
    ) {
      return Response.json(
        { success: false, error: result.error.message },
        { status: 404 },
      );
    }

    return Response.json(
      { success: false, error: result.error.message },
      { status: 500 },
    );
  } catch (error) {
    console.error("Lead scoring error:", error);

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
    }

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to score lead",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

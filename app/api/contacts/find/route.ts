import { findContactsForCompany } from "@/lib/server/services/contacts/find-contacts-for-company";
import { toServiceJsonErrorResponse } from "@/lib/server/http/error-response";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { companyId?: string };
    const result = await findContactsForCompany({ companyId: body.companyId });

    if (result.ok) {
      return Response.json({
        success: true,
        data: result.data,
      });
    }
    return toServiceJsonErrorResponse(result.error, {
      includeDetailsAsData: true,
    });
  } catch (error) {
    console.error("Contact finder error:", error);
    return toServiceJsonErrorResponse({
      code: "UNKNOWN",
      message:
        error instanceof Error ? error.message : "Failed to find contacts",
    });
  }
}

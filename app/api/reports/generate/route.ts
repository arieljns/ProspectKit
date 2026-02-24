import { generateCompanyReport } from "@/lib/server/services/reports/generate-company-report";
import { toServiceJsonErrorResponse } from "@/lib/server/http/error-response";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { companyId?: string };
    const result = await generateCompanyReport({ companyId: body.companyId });

    if (result.ok) {
      return Response.json({
        success: true,
        data: result.data,
      });
    }
    return toServiceJsonErrorResponse(result.error);
  } catch (error) {
    console.error("Report generation error:", error);
    return toServiceJsonErrorResponse({
      code: "UNKNOWN",
      message:
        error instanceof Error ? error.message : "Failed to generate report",
    });
  }
}

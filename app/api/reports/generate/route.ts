import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import {
  getCompanyById,
  updateCompanyReportStatus,
} from "@/lib/actions/companies";
import {
  createOrUpdateReport,
  markReportAsGenerating,
} from "@/lib/actions/company-reports";
import { reportDataSchema } from "@/lib/db/schema/company-reports";

export const maxDuration = 60;

export async function POST(req: Request) {
  let companyId: string | undefined;

  try {
    const body = (await req.json()) as { companyId?: string };
    companyId = body.companyId;

    if (!companyId) {
      return Response.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    // 1. Get company info
    const companyResult = await getCompanyById(companyId);
    if (!companyResult.success) {
      return Response.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    const company = companyResult.data!;

    // 2. Mark as generating
    await markReportAsGenerating(companyId);

    // 3. Generate report using AI with Live Search
    const systemPrompt = `You are a professional business research analyst.
Research the given company using Live Search to gather the latest information and generate a comprehensive structured research report.

Requirements:
1. Use Live Search to get current data (news, websites, social media)
2. Analyze company strengths, challenges, and market position
3. Identify key products and services
4. Provide market analysis and competitor information
5. Discover business opportunities

Return strictly structured data that matches the JSON schema.`;

    const userPrompt = `Research company: ${company.companyName}
${company.industry ? `Industry: ${company.industry}` : ""}
${company.size ? `Company size: ${company.size} employees` : ""}
${company.website ? `Website: ${company.website}` : ""}
${company.description ? `Description: ${company.description}` : ""}

Generate a detailed company research report with the following structure:
- Company overview and summary
- Key strengths (3-5 points) and challenges (3-5 points)
- Market position analysis
- Main products/services with descriptions and categories
- Market analysis: target market, main competitors, market size
- Recent news and updates (if available)
- Business opportunities (3-5 points)

Use Live Search to get the most current and accurate information about ${company.companyName}.`;

    const { object: reportData } = await generateObject({
      model: xai("grok-4-fast-non-reasoning-latest"),
      schema: reportDataSchema,
      schemaName: "CompanyResearchReport",
      schemaDescription: "A comprehensive company research report",
      system: systemPrompt,
      prompt: userPrompt,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: "on", // Force search for accurate data
            returnCitations: true,
            maxSearchResults: 15,
            sources: [
              { type: "web", safeSearch: true },
              { type: "news", safeSearch: true },
              { type: "x" },
            ],
          },
        },
      },
    });

    // 4. Save report to database
    const saveResult = await createOrUpdateReport(companyId, reportData);

    if (!saveResult.success) {
      throw new Error(saveResult.error || "Failed to save report");
    }

    // 5. Return success
    return Response.json({
      success: true,
      data: {
        reportId: saveResult.data!.id,
        companyId,
      },
    });
  } catch (error) {
    console.error("Report generation error:", error);

    // Try to update status to failed
    try {
      if (companyId) {
        await updateCompanyReportStatus(companyId, "failed");
      }
    } catch {
      // Ignore error during cleanup
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate report",
      },
      { status: 500 },
    );
  }
}

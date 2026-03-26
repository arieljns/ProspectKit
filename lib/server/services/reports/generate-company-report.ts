import "server-only";

import { generateObject } from "ai";

import { getChatModel } from "@/lib/ai/model";
import {
  reportDataSchema,
  type ReportData,
} from "@/lib/db/schema/company-reports";
import {
  formatExaResultsForPrompt,
  searchExa,
} from "@/lib/server/services/search/exa";
import {
  findCompanyReportByCompanyId,
  upsertCompanyReportByCompanyId,
} from "@/lib/server/repositories/company-reports-repo";
import {
  findCompanyById,
  setCompanyReportStatus,
} from "@/lib/server/repositories/companies-repo";
import { err, ok, type ServiceResult } from "@/lib/server/shared/result";

export type GenerateCompanyReportErrorCode =
  | "INVALID_INPUT"
  | "COMPANY_NOT_FOUND"
  | "EXTERNAL_SEARCH_FAILED"
  | "AI_GENERATION_FAILED"
  | "DB_WRITE_FAILED"
  | "UNKNOWN";

export type GenerateCompanyReportOutput = {
  reportId: string;
  companyId: string;
};

const EMPTY_REPORT_DATA = {} as ReportData;

export async function generateCompanyReport(input: {
  companyId?: string;
}): Promise<
  ServiceResult<GenerateCompanyReportOutput, GenerateCompanyReportErrorCode>
> {
  let companyId: string | undefined;

  try {
    companyId = input.companyId?.trim();
    if (!companyId) {
      return err("INVALID_INPUT", "Company ID is required");
    }

    const company = await findCompanyById(companyId);
    if (!company) {
      return err("COMPANY_NOT_FOUND", "Company not found");
    }

    await setCompanyReportStatus(companyId, "generating");
    await upsertCompanyReportByCompanyId(
      companyId,
      EMPTY_REPORT_DATA,
      "generating",
    );

    const recentNewsStartDate = new Date();
    recentNewsStartDate.setMonth(recentNewsStartDate.getMonth() - 12);

    let companySearchContext = "";
    try {
      const [overviewResults, newsResults] = await Promise.all([
        searchExa({
          query: `${company.companyName} company overview products services customers competitors market position`,
          type: "auto",
          numResults: 6,
          contents: {
            highlights: {
              maxCharacters: 1200,
              query:
                "Find company overview, products, customers, competitors, market position, and business opportunities.",
            },
          },
        }),
        searchExa({
          query: `${company.companyName} recent news updates announcements funding launches partnerships`,
          type: "auto",
          category: "news",
          numResults: 5,
          startPublishedDate: recentNewsStartDate.toISOString().slice(0, 10),
          contents: {
            highlights: {
              maxCharacters: 1200,
              query:
                "Find recent news, launches, partnerships, funding updates, and notable business developments.",
            },
            maxAgeHours: 0,
          },
        }),
      ]);

      companySearchContext = [
        formatExaResultsForPrompt(
          overviewResults,
          "Exa company research results",
        ),
        formatExaResultsForPrompt(newsResults, "Exa recent news results"),
      ].join("\n\n");
    } catch (error) {
      return err(
        "EXTERNAL_SEARCH_FAILED",
        error instanceof Error ? error.message : "Failed to search the web",
      );
    }

    const systemPrompt = `You are a professional business research analyst.
Use the provided Exa search context to generate a comprehensive structured research report.

Requirements:
1. Stay grounded in the provided search context
2. Analyze company strengths, challenges, and market position
3. Identify key products and services
4. Provide market analysis and competitor information
5. Discover business opportunities

If a field is not supported by the context:
- Use "Not enough public information found." for required text fields
- Use [] for required arrays
- Omit optional fields when necessary

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

${companySearchContext}`;

    let reportData: ReportData;
    try {
      const generated = await generateObject({
        model: getChatModel(),
        schema: reportDataSchema,
        schemaName: "CompanyResearchReport",
        schemaDescription: "A comprehensive company research report",
        system: systemPrompt,
        prompt: userPrompt,
      });
      reportData = generated.object;
    } catch (error) {
      return err(
        "AI_GENERATION_FAILED",
        error instanceof Error ? error.message : "Failed to generate report",
      );
    }

    const savedReport = await upsertCompanyReportByCompanyId(
      companyId,
      reportData,
      "completed",
    );
    if (!savedReport) {
      return err("DB_WRITE_FAILED", "Failed to save report");
    }

    await setCompanyReportStatus(companyId, "completed");

    return ok({
      reportId: savedReport.id,
      companyId,
    });
  } catch (error) {
    return err(
      "UNKNOWN",
      error instanceof Error ? error.message : "Failed to generate report",
    );
  } finally {
    if (companyId) {
      // Only force failed when report is still in generating state.
      const report = await findCompanyReportByCompanyId(companyId).catch(
        () => null,
      );
      if (report?.status === "generating") {
        await setCompanyReportStatus(companyId, "failed").catch(() => {});
        await upsertCompanyReportByCompanyId(
          companyId,
          report.reportData,
          "failed",
        ).catch(() => {});
      }
    }
  }
}

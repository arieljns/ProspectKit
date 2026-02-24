import "server-only";

import { generateObject } from "ai";
import { xai } from "@ai-sdk/xai";

import {
  reportDataSchema,
  type ReportData,
} from "@/lib/db/schema/company-reports";
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

    let reportData: ReportData;
    try {
      const generated = await generateObject({
        model: xai("grok-4-fast-non-reasoning-latest"),
        schema: reportDataSchema,
        schemaName: "CompanyResearchReport",
        schemaDescription: "A comprehensive company research report",
        system: systemPrompt,
        prompt: userPrompt,
        providerOptions: {
          xai: {
            searchParameters: {
              mode: "on",
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

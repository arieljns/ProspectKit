import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

const companyInfoSchema = z.object({
  industry: z
    .string()
    .optional()
    .describe(
      "The primary industry/sector (e.g., SaaS, FinTech, AI/ML, Healthcare, E-commerce)",
    ),
  size: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
    .optional()
    .describe("Approximate number of employees"),
  website: z.string().url().optional().describe("Official company website URL"),
  description: z
    .string()
    .optional()
    .describe("Brief description of what the company does (1-2 sentences)"),
});

export async function POST(req: Request) {
  try {
    const { companyName } = await req.json();

    if (!companyName || !companyName.trim()) {
      return Response.json(
        { success: false, error: "Company name is required" },
        { status: 400 },
      );
    }

    // Use an AI model with Live Search to find company information
    const { object: companyInfo } = await generateObject({
      model: xai("grok-4-fast-non-reasoning-latest"),
      schema: companyInfoSchema,
      schemaName: "CompanyInfo",
      schemaDescription: "Information about a company",
      prompt: `Search for information about the company: "${companyName}"

Use Live Search to find:
1. Industry/Sector - What industry does this company operate in?
2. Company Size - Approximate number of employees (choose from: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
3. Website - Official website URL
4. Description - What does this company do? (1-2 sentences)

Be accurate and use real data from search results.`,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: "on",
            returnCitations: false,
            maxSearchResults: 5,
          },
        },
      },
    });

    return Response.json({
      success: true,
      data: companyInfo,
    });
  } catch (error) {
    console.error("Auto-fill error:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to auto-fill",
      },
      { status: 500 },
    );
  }
}

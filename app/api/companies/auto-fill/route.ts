import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/model";
import {
  formatExaResultsForPrompt,
  searchExa,
} from "@/lib/server/services/search/exa";

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

    const searchResults = await searchExa({
      query: `${companyName} official website industry employee count company description`,
      type: "auto",
      category: "company",
      numResults: 5,
      contents: {
        highlights: {
          maxCharacters: 1400,
          query:
            "Find the company's official website, primary industry, approximate employee count, and a concise description of what it does.",
        },
      },
    });

    const { object: companyInfo } = await generateObject({
      model: getChatModel(),
      schema: companyInfoSchema,
      schemaName: "CompanyInfo",
      schemaDescription: "Information about a company",
      system: `You extract company information from Exa web search results.
Use only the provided search context.
Prefer the official website and first-party company descriptions when available.
If a field is not supported by the context, omit it.`,
      prompt: `Company name: "${companyName}"

${formatExaResultsForPrompt(searchResults, "Exa company search context")}

Extract:
1. Industry/Sector
2. Approximate company size (choose from: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
3. Official website URL
4. Brief company description (1-2 sentences)`,
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

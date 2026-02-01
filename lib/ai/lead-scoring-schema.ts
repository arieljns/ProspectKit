import { z } from "zod";

/**
 * Schema for AI-generated lead scoring results
 * Grok will evaluate a contact across 5 dimensions and provide scores + reasoning
 */
export const leadScoringSchema = z.object({
  // Dimension scores (0-100)
  industryMatchScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe("How well does the lead's company industry align with target industries? 0-100"),

  companyMatchScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Based on company business and challenges, how likely do they need the product? 0-100"
    ),

  positionMatchScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Is this person a decision maker or potential user of the product? 0-100"
    ),

  seniorityMatchScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Does the lead's seniority level match target levels (C-level, VP, Director, etc.)? 0-100"
    ),

  dealSizeScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      "Combines company size with product need to estimate revenue potential. 0-100"
    ),

  // Reasoning for each dimension
  reasoning: z.object({
    industryMatch: z
      .string()
      .describe("1-2 sentence explanation for industryMatchScore"),

    companyMatch: z
      .string()
      .describe("1-2 sentence explanation for companyMatchScore"),

    positionMatch: z
      .string()
      .describe("1-2 sentence explanation for positionMatchScore"),

    seniorityMatch: z
      .string()
      .describe("1-2 sentence explanation for seniorityMatchScore"),

    dealSize: z
      .string()
      .describe("1-2 sentence explanation for dealSizeScore"),
  }),
});

export type LeadScoringResult = z.infer<typeof leadScoringSchema>;

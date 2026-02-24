import "server-only";

import { eq } from "drizzle-orm";
import { generateObject } from "ai";
import { xai } from "@ai-sdk/xai";

import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema/contacts";
import { companies } from "@/lib/db/schema/companies";
import { leadScores } from "@/lib/db/schema/lead-scores";
import { scoringConfig } from "@/lib/db/schema/scoring-config";
import { leadScoringSchema } from "@/lib/ai/lead-scoring-schema";
import { err, ok, type ServiceResult } from "@/lib/server/shared/result";

type ScoringWeights = {
  industryMatch: number;
  companyMatch: number;
  positionMatch: number;
  seniorityMatch: number;
  dealSizeMatch: number;
};

const DEFAULT_SCORING_CONFIG = {
  userCompanyName: "ProspectKit",
  userCompanyDescription:
    "An open-source outbound workspace built for small teams.",
  productDescription:
    "ProspectKit helps teams run a lean outbound workflow: company research, contact discovery, lead scoring, and outreach drafting.",
  targetIndustries: ["SaaS", "Developer Tools", "AI/ML", "FinTech"],
  targetSeniorityLevels: ["C-level", "VP", "Director"],
  weights: {
    industryMatch: 25,
    companyMatch: 30,
    positionMatch: 20,
    seniorityMatch: 15,
    dealSizeMatch: 10,
  } satisfies ScoringWeights,
};

export type ScoreLeadForContactOutput = {
  contactId: string;
  contactName: string;
  companyName: string;
  scores: {
    industryMatchScore: number;
    companyMatchScore: number;
    positionMatchScore: number;
    seniorityMatchScore: number;
    dealSizeScore: number;
  };
  reasoning: {
    industryMatch: string;
    companyMatch: string;
    positionMatch: string;
    seniorityMatch: string;
    dealSize: string;
  };
};

export type ScoreLeadForContactErrorCode =
  | "INVALID_INPUT"
  | "CONTACT_NOT_FOUND"
  | "CONTACT_COMPANY_NOT_FOUND"
  | "SCORING_CONFIG_MISSING"
  | "AI_GENERATION_FAILED"
  | "DB_WRITE_FAILED"
  | "UNKNOWN";

async function getOrCreateScoringConfig() {
  const [config] = await db
    .select()
    .from(scoringConfig)
    .where(eq(scoringConfig.id, "default"))
    .limit(1);

  if (config) {
    return config;
  }

  const [created] = await db
    .insert(scoringConfig)
    .values({
      id: "default",
      ...DEFAULT_SCORING_CONFIG,
    })
    .returning();

  return created ?? null;
}

export async function scoreLeadForContact(input: {
  contactId?: string;
}): Promise<ServiceResult<ScoreLeadForContactOutput, ScoreLeadForContactErrorCode>> {
  try {
    const contactId = input.contactId?.trim();
    if (!contactId) {
      return err("INVALID_INPUT", "Contact ID is required");
    }

    const [contactResult] = await db
      .select({
        contact: contacts,
        company: companies,
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (!contactResult) {
      return err("CONTACT_NOT_FOUND", "Contact not found");
    }

    const { contact, company } = contactResult;
    if (!company) {
      return err("CONTACT_COMPANY_NOT_FOUND", "Contact company not found");
    }

    const config = await getOrCreateScoringConfig();
    if (!config) {
      return err(
        "SCORING_CONFIG_MISSING",
        "Scoring configuration not found. Please configure your settings first.",
      );
    }

    const systemPrompt = `You are an expert Sales Development Representative (SDR) analyst specialized in lead qualification.

Your task is to evaluate a sales lead across 5 key dimensions and provide scores (0-100) with reasoning.

SCORING GUIDELINES:
- 0-20: Poor fit - significant misalignment
- 21-40: Weak fit - some concerning gaps
- 41-60: Moderate fit - acceptable but not ideal
- 61-80: Good fit - strong alignment
- 81-100: Excellent fit - highly qualified lead

IMPORTANT:
- Use Live Search to gather additional context about the contact and company if needed
- Base your scores on factual information, not assumptions
- Provide one sentence reasoning for each score
- Consider the user's product and target customer profile in your evaluation`;

    const userPrompt = `Evaluate this sales lead:

=== USER'S COMPANY & PRODUCT ===
Company: ${config.userCompanyName}
Description: ${config.userCompanyDescription}
Product/Service: ${config.productDescription}

=== TARGET CUSTOMER PROFILE ===
Target Industries: ${(config.targetIndustries as string[]).join(", ")}
Target Seniority Levels: ${(config.targetSeniorityLevels as string[]).join(", ")}

=== LEAD TO EVALUATE ===
Contact Name: ${contact.name}
Title: ${contact.title}
${contact.department ? `Department: ${contact.department}` : ""}
${contact.linkedinUrl ? `LinkedIn: ${contact.linkedinUrl}` : ""}

Company Name: ${company.companyName}
${company.industry ? `Industry: ${company.industry}` : ""}
${company.size ? `Company Size: ${company.size}` : ""}
${company.description ? `Company Description: ${company.description}` : ""}
${company.website ? `Website: ${company.website}` : ""}

=== SCORING DIMENSIONS ===

1. INDUSTRY MATCH (0-100)
   Does the lead's company operate in your target industries?
   Consider: Industry alignment, market relevance, sector fit

2. COMPANY NEED MATCH (0-100)
   Based on the company's business and challenges, how likely do they need your product?
   Consider: Business model fit, pain points your product solves, company stage/maturity

3. POSITION MATCH (0-100)
   Is this person a decision maker or potential user of your product?
   Consider: Job function relevance, department alignment, role in buying process

4. SENIORITY MATCH (0-100)
   Does the lead's seniority level match your target levels?
   Consider: Decision-making authority, budget control, influence level

5. DEAL SIZE POTENTIAL (0-100)
   What is the revenue opportunity potential?
   Consider: Company size, budget indicators, expansion potential, product need intensity

Provide scores and 1-2 sentence reasoning for each dimension.`;

    let result: {
      industryMatchScore: number;
      companyMatchScore: number;
      positionMatchScore: number;
      seniorityMatchScore: number;
      dealSizeScore: number;
      reasoning: {
        industryMatch: string;
        companyMatch: string;
        positionMatch: string;
        seniorityMatch: string;
        dealSize: string;
      };
    };

    try {
      const generated = await generateObject({
        model: xai("grok-4-fast-non-reasoning-latest"),
        schema: leadScoringSchema,
        schemaName: "LeadScoringResult",
        schemaDescription:
          "AI-generated lead qualification scores across 5 dimensions",
        system: systemPrompt,
        prompt: userPrompt,
        providerOptions: {
          xai: {
            searchParameters: {
              mode: "on",
              returnCitations: false,
              maxSearchResults: 5,
              sources: [
                {
                  type: "web",
                  allowedWebsites: ["linkedin.com", "crunchbase.com"],
                },
              ],
            },
          },
        },
      });

      result = generated.object;
    } catch (error) {
      console.error("Lead scoring AI generation error:", error);
      return err(
        "AI_GENERATION_FAILED",
        error instanceof Error ? error.message : "Failed to score lead",
      );
    }

    try {
      await db
        .insert(leadScores)
        .values({
          contactId: contact.id,
          industryMatchScore: result.industryMatchScore,
          companyMatchScore: result.companyMatchScore,
          positionMatchScore: result.positionMatchScore,
          seniorityMatchScore: result.seniorityMatchScore,
          dealSizeScore: result.dealSizeScore,
          reasoning: result.reasoning,
        })
        .onConflictDoUpdate({
          target: leadScores.contactId,
          set: {
            contactId: contact.id,
            industryMatchScore: result.industryMatchScore,
            companyMatchScore: result.companyMatchScore,
            positionMatchScore: result.positionMatchScore,
            seniorityMatchScore: result.seniorityMatchScore,
            dealSizeScore: result.dealSizeScore,
            reasoning: result.reasoning,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Failed to save lead score:", error);
      return err(
        "DB_WRITE_FAILED",
        error instanceof Error ? error.message : "Failed to save score",
      );
    }

    return ok({
      contactId: contact.id,
      contactName: contact.name,
      companyName: company.companyName,
      scores: {
        industryMatchScore: result.industryMatchScore,
        companyMatchScore: result.companyMatchScore,
        positionMatchScore: result.positionMatchScore,
        seniorityMatchScore: result.seniorityMatchScore,
        dealSizeScore: result.dealSizeScore,
      },
      reasoning: result.reasoning,
    });
  } catch (error) {
    console.error("Lead scoring service error:", error);
    return err(
      "UNKNOWN",
      error instanceof Error ? error.message : "Failed to score lead",
    );
  }
}

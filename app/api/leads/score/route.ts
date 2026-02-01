import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { getContactById } from "@/lib/actions/contacts";
import { getScoringConfig } from "@/lib/actions/scoring-config";
import { saveLeadScore } from "@/lib/actions/lead-scores";
import { leadScoringSchema } from "@/lib/ai/lead-scoring-schema";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { contactId } = await req.json();

    if (!contactId) {
      return Response.json({ success: false, error: "Contact ID is required" }, { status: 400 });
    }

    // 1. Get contact and company info (getContactById returns both)
    const contactResult = await getContactById(contactId);
    if (!contactResult.success || !contactResult.data) {
      return Response.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    const { contact, company } = contactResult.data;

    if (!company) {
      return Response.json({ success: false, error: "Contact company not found" }, { status: 404 });
    }

    // 3. Get scoring configuration
    const configResult = await getScoringConfig();
    if (!configResult.success || !configResult.data) {
      return Response.json(
        {
          success: false,
          error: "Scoring configuration not found. Please configure your settings first.",
        },
        { status: 404 }
      );
    }
    const config = configResult.data;

    // 4. Build AI prompt
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

    // 5. Use Grok to score the lead
    const { object: result } = await generateObject({
      model: xai("grok-4-fast-non-reasoning-latest"),
      schema: leadScoringSchema,
      schemaName: "LeadScoringResult",
      schemaDescription: "AI-generated lead qualification scores across 5 dimensions",
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

    // 6. Save the score to database
    const saveResult = await saveLeadScore({
      contactId: contact.id,
      industryMatchScore: result.industryMatchScore,
      companyMatchScore: result.companyMatchScore,
      positionMatchScore: result.positionMatchScore,
      seniorityMatchScore: result.seniorityMatchScore,
      dealSizeScore: result.dealSizeScore,
      reasoning: result.reasoning,
    });

    if (!saveResult.success) {
      return Response.json({ success: false, error: saveResult.error || "Failed to save score" }, { status: 500 });
    }

    // 7. Return success with scores
    return Response.json({
      success: true,
      data: {
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
      },
    });
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
      { status: 500 }
    );
  }
}

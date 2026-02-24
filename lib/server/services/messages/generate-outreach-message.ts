import "server-only";

import { streamText } from "ai";
import { xai } from "@ai-sdk/xai";

import { DEFAULT_SCORING_CONFIG } from "@/lib/server/domain/default-scoring-config";
import { findContactWithCompanyById } from "@/lib/server/repositories/contacts-repo";
import { findLeadScoreByContactId } from "@/lib/server/repositories/lead-scores-repo";
import { getOrCreateDefaultScoringConfig } from "@/lib/server/repositories/scoring-config-repo";
import { err, ok, type ServiceResult } from "@/lib/server/shared/result";

export type GenerateOutreachMessageInput = {
  contactId?: string;
  messageType?: string;
  feedback?: string;
};

type MessageStream = ReturnType<typeof streamText>;

export type GenerateOutreachMessageErrorCode =
  | "INVALID_INPUT"
  | "CONTACT_NOT_FOUND"
  | "CONTACT_COMPANY_NOT_FOUND"
  | "SCORING_CONFIG_MISSING"
  | "UNKNOWN";

export async function generateOutreachMessage(
  input: GenerateOutreachMessageInput,
): Promise<
  ServiceResult<{ stream: MessageStream }, GenerateOutreachMessageErrorCode>
> {
  try {
    const contactId = input.contactId?.trim();
    const messageType = input.messageType?.trim();
    const feedback = input.feedback;

    if (!contactId || !messageType) {
      return err("INVALID_INPUT", "Missing required fields");
    }

    const contactResult = await findContactWithCompanyById(contactId);
    if (!contactResult) {
      return err("CONTACT_NOT_FOUND", "Contact not found");
    }

    const { contact, company } = contactResult;
    if (!company) {
      return err("CONTACT_COMPANY_NOT_FOUND", "Contact company not found");
    }

    const config = await getOrCreateDefaultScoringConfig(DEFAULT_SCORING_CONFIG);
    if (!config) {
      return err("SCORING_CONFIG_MISSING", "Scoring configuration not found");
    }

    const leadScore = await findLeadScoreByContactId(contactId);

    const systemPrompt = `You are an expert SDR (Sales Development Representative) copywriter specialized in writing personalized, high-converting outreach messages.

Your writing style:
- Research-driven and specific (not generic)
- Conversational and human (not salesy or pushy)
- Focused on the prospect's problems, not your product
- Clear and concise
- Professional but approachable

IMPORTANT:
- Only output the message text itself
- Do NOT include subject lines, signatures, or metadata
- Do NOT use placeholder brackets like [Your Name] - write actual content
- Make it feel natural and conversational`;

    let userPrompt = "";

    if (messageType === "linkedin-connection") {
      userPrompt = `Write a LinkedIn connection request message.

CONSTRAINTS:
- Maximum 300 characters (strict limit)
- No subject line
- Direct and friendly tone
- Show you've done research

PROSPECT INFORMATION:
Name: ${contact.name}
Title: ${contact.title}
${contact.department ? `Department: ${contact.department}` : ""}
Company: ${company.companyName}
${company.industry ? `Industry: ${company.industry}` : ""}
${company.size ? `Company Size: ${company.size}` : ""}

YOUR COMPANY:
${config.userCompanyName}
Product: ${config.productDescription}

${
  leadScore?.reasoning
    ? `WHY THEY'RE A GOOD FIT:
${leadScore.reasoning.industryMatch ? `- Industry: ${leadScore.reasoning.industryMatch}` : ""}
${leadScore.reasoning.companyMatch ? `- Company Need: ${leadScore.reasoning.companyMatch}` : ""}
${leadScore.reasoning.positionMatch ? `- Position: ${leadScore.reasoning.positionMatch}` : ""}`
    : ""
}

${
  feedback
    ? `\nUSER FEEDBACK: ${feedback}\nAdjust the message based on this feedback while keeping it under 300 characters.`
    : ""
}

Write the connection request now:`;
    } else {
      userPrompt = `Write a personalized cold outreach email/InMail.

TARGET LENGTH: 150-250 words

STRUCTURE:
1. Opening: Show research + why you're reaching out
2. Value: Address their specific pain point with your solution
3. CTA: Soft ask (not pushy)

PROSPECT INFORMATION:
Name: ${contact.name}
Title: ${contact.title}
${contact.department ? `Department: ${contact.department}` : ""}
Company: ${company.companyName}
${company.industry ? `Industry: ${company.industry}` : ""}
${company.size ? `Company Size: ${company.size}` : ""}
${company.description ? `Company Description: ${company.description}` : ""}

YOUR COMPANY:
${config.userCompanyName}
Company Description: ${config.userCompanyDescription}
Product: ${config.productDescription}

${
  leadScore?.reasoning
    ? `WHY THEY'RE A GOOD FIT:
${leadScore.reasoning.industryMatch ? `- Industry Match: ${leadScore.reasoning.industryMatch}` : ""}
${leadScore.reasoning.companyMatch ? `- Company Need: ${leadScore.reasoning.companyMatch}` : ""}
${leadScore.reasoning.positionMatch ? `- Position Match: ${leadScore.reasoning.positionMatch}` : ""}
${leadScore.reasoning.seniorityMatch ? `- Seniority: ${leadScore.reasoning.seniorityMatch}` : ""}`
    : ""
}

${feedback ? `\nUSER FEEDBACK: ${feedback}\nAdjust the message based on this feedback.` : ""}

Write the email/InMail now (no subject line, no signature):`;
    }

    const stream = streamText({
      model: xai("grok-4-fast-non-reasoning-latest"),
      system: systemPrompt,
      prompt: userPrompt,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: "on",
            returnCitations: true,
            maxSearchResults: 5,
          },
        },
      },
    });

    return ok({ stream });
  } catch (error) {
    return err(
      "UNKNOWN",
      error instanceof Error ? error.message : "Failed to generate message",
    );
  }
}

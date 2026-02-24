import { xai } from "@ai-sdk/xai";
import { streamText } from "ai";
import { getContactById } from "@/lib/actions/contacts";
import { getScoringConfig } from "@/lib/actions/scoring-config";
import { getLeadScore } from "@/lib/actions/lead-scores";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { contactId, messageType, feedback } = await req.json();

    if (!contactId || !messageType) {
      return new Response("Missing required fields", { status: 400 });
    }

    // 1. Get contact and company info
    const contactResult = await getContactById(contactId);
    if (!contactResult.success || !contactResult.data) {
      return new Response("Contact not found", { status: 404 });
    }

    const { contact, company } = contactResult.data;

    if (!company) {
      return new Response("Contact company not found", { status: 404 });
    }

    // 2. Get scoring configuration
    const configResult = await getScoringConfig();
    if (!configResult.success || !configResult.data) {
      return new Response("Scoring configuration not found", { status: 404 });
    }
    const config = configResult.data;

    // 3. Get lead score (if available)
    const scoreResult = await getLeadScore(contactId);
    const leadScore = scoreResult.success ? scoreResult.data : null;

    // 4. Build prompt based on message type
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
    let characterLimit = 2000;

    if (messageType === "linkedin-connection") {
      characterLimit = 300;
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
      // LinkedIn InMail / Cold Email
      characterLimit = 2000;
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

    // 5. Stream the message generation
    const result = streamText({
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

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Message generation error:", error);
    return new Response(
      error instanceof Error ? error.message : "Failed to generate message",
      { status: 500 },
    );
  }
}

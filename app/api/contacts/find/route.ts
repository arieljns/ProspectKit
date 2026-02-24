import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { getCompanyById } from "@/lib/actions/companies";
import { createContact } from "@/lib/actions/contacts";
import { contactFinderSchema } from "@/lib/ai/contact-finder-schema";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { companyId } = await req.json();

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

    // 2. Use AI to find contacts via Live Search (LinkedIn only)
    const systemPrompt = `You are a Sales Development Representative (SDR) assistant.
Your job is to find key contacts and decision makers at a given company using Live Search.

CRITICAL INSTRUCTIONS:
- Use Live Search to find real contacts from LinkedIn and company websites
- Return ONLY contacts you find through search results
- Do NOT make up or invent names or details
- Focus on finding people currently working at the company
- Return approximately 5 contacts (or fewer if less are found)
- If you cannot find specific contacts, return an empty contacts array

RESPONSE FORMAT:
- You MUST respond with ONLY valid JSON matching the schema
- Do NOT add any explanations, notes, or markdown after the JSON
- Do NOT include "## Explanation" or any other text after the JSON object

Extract for each contact:
- Full name
- Current job title
- Department (if identifiable from title or profile)
- LinkedIn profile URL (if available)`;

    const userPrompt = `Find key contacts at: ${company.companyName}
${company.industry ? `Industry: ${company.industry}` : ""}
${company.website ? `Website: ${company.website}` : ""}
${company.description ? `Description: ${company.description}` : ""}

Search for people currently working at ${company.companyName}.
Try multiple search strategies:
1. LinkedIn employee searches
2. Company website team/about pages
3. News articles mentioning executives
4. Press releases with contact names

Look for contacts across different departments (Engineering, Sales, Marketing, Executive).

Return up to 5 contacts with their name, title, department (optional), and LinkedIn URL (if found).

REMINDER: Return ONLY the JSON object, no additional text or explanations.`;

    const { object: result } = await generateObject({
      model: xai("grok-4-fast-non-reasoning-latest"),
      schema: contactFinderSchema,
      schemaName: "ContactFinderResult",
      schemaDescription: "Key contacts found at a company via web search",
      system: systemPrompt,
      prompt: userPrompt,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: "on",
            returnCitations: false,
            maxSearchResults: 15,
            // Allow broader search: LinkedIn, company websites, news sites
            sources: [
              {
                type: "web",
              },
            ],
          },
        },
      },
    });

    // 3. Handle case where no contacts found
    if (result.contacts.length === 0) {
      return Response.json({
        success: false,
        error: `No contacts found for ${company.companyName}. Try adding contacts manually or search for a different company with more public information.`,
        data: {
          companyId,
          companyName: company.companyName,
          contactsFound: 0,
          contactsSaved: 0,
          contactsFailed: 0,
        },
      });
    }

    // 4. Save contacts to database
    const savePromises = result.contacts.map((contact) =>
      createContact({
        companyId: company.id,
        name: contact.name,
        title: contact.title,
        department: contact.department || null,
        linkedinUrl: contact.linkedinUrl || null,
        contactStatus: "new",
        priority: "Low",
        lastContactedAt: null,
        notes: null,
      }),
    );

    const saveResults = await Promise.all(savePromises);
    const successCount = saveResults.filter((r) => r.success).length;
    const failCount = saveResults.filter((r) => !r.success).length;

    // 5. Return success
    return Response.json({
      success: true,
      data: {
        companyId,
        companyName: company.companyName,
        contactsFound: result.contacts.length,
        contactsSaved: successCount,
        contactsFailed: failCount,
      },
    });
  } catch (error) {
    console.error("Contact finder error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to find contacts",
      },
      { status: 500 },
    );
  }
}

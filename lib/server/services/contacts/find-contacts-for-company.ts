import "server-only";

import { generateObject } from "ai";

import { contactFinderSchema } from "@/lib/ai/contact-finder-schema";
import { getChatModel } from "@/lib/ai/model";
import { type NewContactParams } from "@/lib/db/schema/contacts";
import { findCompanyById } from "@/lib/server/repositories/companies-repo";
import { insertContact } from "@/lib/server/repositories/contacts-repo";
import {
  extractDomain,
  formatExaResultsForPrompt,
  searchExa,
} from "@/lib/server/services/search/exa";
import { err, ok, type ServiceResult } from "@/lib/server/shared/result";

export type FindContactsForCompanyOutput = {
  companyId: string;
  companyName: string;
  contactsFound: number;
  contactsSaved: number;
  contactsFailed: number;
};

export type FindContactsForCompanyErrorCode =
  | "INVALID_INPUT"
  | "COMPANY_NOT_FOUND"
  | "NO_CONTACTS_FOUND"
  | "EXTERNAL_SEARCH_FAILED"
  | "AI_GENERATION_FAILED"
  | "UNKNOWN";

type NoContactsDetails = {
  companyId: string;
  companyName: string;
  contactsFound: 0;
  contactsSaved: 0;
  contactsFailed: 0;
};

type FoundContact = {
  name: string;
  title: string;
  department?: string;
  linkedinUrl?: string;
};

export async function findContactsForCompany(input: {
  companyId?: string;
}): Promise<
  ServiceResult<FindContactsForCompanyOutput, FindContactsForCompanyErrorCode>
> {
  try {
    const companyId = input.companyId?.trim();
    if (!companyId) {
      return err("INVALID_INPUT", "Company ID is required");
    }

    const company = await findCompanyById(companyId);

    if (!company) {
      return err("COMPANY_NOT_FOUND", "Company not found");
    }

    const companyDomain = extractDomain(company.website);

    let searchContext = "";
    try {
      const [linkedinResults, websiteResults] = await Promise.all([
        searchExa({
          query: `people currently working at ${company.companyName} in leadership, engineering, sales, and marketing roles`,
          type: "auto",
          numResults: 8,
          includeDomains: ["linkedin.com"],
          contents: {
            highlights: {
              maxCharacters: 900,
              query:
                "Find current employees at the company. Extract full name, current title, department, and LinkedIn profile URL when available.",
            },
          },
        }),
        companyDomain
          ? searchExa({
              query: `${company.companyName} leadership team about executives staff`,
              type: "auto",
              numResults: 5,
              includeDomains: [companyDomain],
              contents: {
                highlights: {
                  maxCharacters: 900,
                  query:
                    "Find employee or executive names, titles, and departments from official company pages.",
                },
              },
            })
          : Promise.resolve([]),
      ]);

      searchContext = [
        formatExaResultsForPrompt(
          linkedinResults,
          "Exa LinkedIn search results",
        ),
        formatExaResultsForPrompt(
          websiteResults,
          "Exa official website results",
        ),
      ].join("\n\n");
    } catch (error) {
      return err(
        "EXTERNAL_SEARCH_FAILED",
        error instanceof Error ? error.message : "Failed to search the web",
      );
    }

    const systemPrompt = `You are a Sales Development Representative (SDR) assistant.
Your job is to find key contacts and decision makers at a given company from the provided Exa search context.

CRITICAL INSTRUCTIONS:
- Return ONLY contacts supported by the provided search context
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

${searchContext}

Look for contacts across different departments (Engineering, Sales, Marketing, Executive).

Return up to 5 contacts with their name, title, department (optional), and LinkedIn URL (if found).

REMINDER: Return ONLY the JSON object, no additional text or explanations.`;

    let result: { contacts: FoundContact[] };
    try {
      const generated = await generateObject({
        model: getChatModel(),
        schema: contactFinderSchema,
        schemaName: "ContactFinderResult",
        schemaDescription:
          "Key contacts found at a company from Exa search results",
        system: systemPrompt,
        prompt: userPrompt,
      });
      result = generated.object;
    } catch (error) {
      console.error("Contact finder AI generation error:", error);
      return err(
        "AI_GENERATION_FAILED",
        error instanceof Error ? error.message : "Failed to find contacts",
      );
    }

    if (result.contacts.length === 0) {
      const details: NoContactsDetails = {
        companyId,
        companyName: company.companyName,
        contactsFound: 0,
        contactsSaved: 0,
        contactsFailed: 0,
      };

      return err(
        "NO_CONTACTS_FOUND",
        `No contacts found for ${company.companyName}. Try adding contacts manually or search for a different company with more public information.`,
        details,
      );
    }

    const saveResults = await Promise.all(
      result.contacts.map(async (contact) => {
        try {
          const input: NewContactParams = {
            companyId: company.id,
            name: contact.name,
            title: contact.title,
            department: contact.department ?? null,
            linkedinUrl: contact.linkedinUrl ?? null,
            contactStatus: "new",
            priority: "Low",
            lastContactedAt: null,
            notes: null,
          };
          const savedContact = await insertContact(input);
          if (!savedContact) {
            return false;
          }
          return true;
        } catch (error) {
          console.error("Failed to save contact:", error);
          return false;
        }
      }),
    );

    const contactsSaved = saveResults.filter(Boolean).length;
    const contactsFailed = saveResults.length - contactsSaved;

    return ok({
      companyId,
      companyName: company.companyName,
      contactsFound: result.contacts.length,
      contactsSaved,
      contactsFailed,
    });
  } catch (error) {
    console.error("Contact finder service error:", error);
    return err(
      "UNKNOWN",
      error instanceof Error ? error.message : "Failed to find contacts",
    );
  }
}

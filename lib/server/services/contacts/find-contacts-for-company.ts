import "server-only";

import { generateObject } from "ai";

import { contactFinderSchema } from "@/lib/ai/contact-finder-schema";
import { getChatModel } from "@/lib/ai/model";
import { type NewContactParams } from "@/lib/db/schema/contacts";
import { findCompanyById } from "@/lib/server/repositories/companies-repo";
import { insertContact } from "@/lib/server/repositories/contacts-repo";
import {
  extractDomain,
  type ExaResult,
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
  | "DB_WRITE_FAILED"
  | "UNKNOWN";

type NoContactsDetails = {
  companyId: string;
  companyName: string;
  contactsFound: 0;
  contactsSaved: 0;
  contactsFailed: 0;
};

type FoundContact = {
  candidateId: string;
  name: string;
  title: string;
  department?: string;
};

type LeadCandidate = {
  id: string;
  linkedinUrl: string;
  title: string;
  highlights: string[];
};

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeLinkedInProfileUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (!hostname.endsWith("linkedin.com") || pathParts[0] !== "in") {
    return null;
  }

  const profileSlug = pathParts[1]?.trim();
  if (!profileSlug) {
    return null;
  }

  return `https://www.linkedin.com/in/${profileSlug}`;
}

function buildLeadCandidates(results: ExaResult[]) {
  const candidates = new Map<string, Omit<LeadCandidate, "id">>();

  for (const result of results) {
    const linkedinUrl = normalizeLinkedInProfileUrl(result.url);
    if (!linkedinUrl || candidates.has(linkedinUrl)) {
      continue;
    }

    candidates.set(linkedinUrl, {
      linkedinUrl,
      title: result.title?.trim() || "Untitled LinkedIn profile",
      highlights: result.highlights ?? [],
    });
  }

  return Array.from(candidates.values()).map((candidate, index) => ({
    id: `candidate-${index + 1}`,
    ...candidate,
  }));
}

function formatLeadCandidatesForPrompt(candidates: LeadCandidate[]) {
  return candidates
    .map((candidate) => {
      const highlights = candidate.highlights
        .map((highlight) => highlight.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");

      return [
        `ID: ${candidate.id}`,
        `LinkedIn URL: ${candidate.linkedinUrl}`,
        `Search result title: ${candidate.title}`,
        highlights ? `Evidence: ${highlights}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

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
    const roleQueries = [
      `current leaders and decision makers at ${company.companyName}`,
      `sales marketing growth product engineering leaders at ${company.companyName}`,
      `founder CEO head VP director manager at ${company.companyName}`,
    ];

    let leadCandidates: LeadCandidate[] = [];
    try {
      const peopleResults = await Promise.all(
        roleQueries.map((query) =>
          searchExa({
            query,
            type: "auto",
            category: "people",
            numResults: 10,
            includeDomains: ["linkedin.com"],
            contents: {
              highlights: {
                maxCharacters: 900,
                query: `Find evidence that this person currently works at ${company.companyName}. Extract their name, current title, department, and whether they are a good sales lead.`,
              },
            },
          }),
        ),
      );

      leadCandidates = buildLeadCandidates(peopleResults.flat()).slice(0, 20);
    } catch (error) {
      return err(
        "EXTERNAL_SEARCH_FAILED",
        error instanceof Error ? error.message : "Failed to search the web",
      );
    }

    if (leadCandidates.length === 0) {
      const details: NoContactsDetails = {
        companyId,
        companyName: company.companyName,
        contactsFound: 0,
        contactsSaved: 0,
        contactsFailed: 0,
      };

      return err(
        "NO_CONTACTS_FOUND",
        `Insufficient leads: no validated LinkedIn profile leads found for ${company.companyName}.`,
        details,
      );
    }

    const systemPrompt = `You are a Sales Development Representative (SDR) assistant.
Your job is to select the best sales leads from a list of LinkedIn profile candidates found by Exa People Search.

CRITICAL INSTRUCTIONS:
- Return ONLY contacts from the provided candidate list
- Each returned contact MUST include an exact candidateId from the candidate list
- Do NOT make up or invent names or details
- Focus on finding people currently working at the company
- Prefer decision makers and prospecting-relevant roles in leadership, sales, marketing, growth, product, partnerships, operations, and engineering management
- Avoid weak or likely irrelevant matches, including employees at similarly named companies
- Return 1 to 5 contacts
- If none of the candidates are suitable leads, return an empty contacts array

RESPONSE FORMAT:
- You MUST respond with ONLY valid JSON matching the schema
- Do NOT add any explanations, notes, or markdown after the JSON
- Do NOT include "## Explanation" or any other text after the JSON object

Extract for each contact:
- Full name
- Current job title
- Department (if identifiable from title or profile)
- Exact candidateId from the candidate list`;

    const userPrompt = `Find key contacts at: ${company.companyName}
${company.industry ? `Industry: ${company.industry}` : ""}
${company.website ? `Website: ${company.website}` : ""}
${company.description ? `Description: ${company.description}` : ""}
${companyDomain ? `Company domain: ${companyDomain}` : ""}

LinkedIn profile candidates from Exa People Search:
${formatLeadCandidatesForPrompt(leadCandidates)}

Look for contacts across different departments (Engineering, Sales, Marketing, Executive).

Return 1 to 5 suitable leads with their name, title, department (optional), and exact candidateId.

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

    const candidatesById = new Map(
      leadCandidates.map((candidate) => [candidate.id, candidate]),
    );

    const selectedContacts = result.contacts
      .map((contact) => {
        const candidate = candidatesById.get(contact.candidateId);
        if (!candidate) {
          return null;
        }

        return {
          ...contact,
          linkedinUrl: candidate.linkedinUrl,
        };
      })
      .filter((contact): contact is FoundContact & { linkedinUrl: string } =>
        Boolean(contact),
      )
      .slice(0, 5);

    if (selectedContacts.length === 0) {
      const details: NoContactsDetails = {
        companyId,
        companyName: company.companyName,
        contactsFound: 0,
        contactsSaved: 0,
        contactsFailed: 0,
      };

      return err(
        "NO_CONTACTS_FOUND",
        `Insufficient leads: no suitable LinkedIn profile leads found for ${company.companyName}.`,
        details,
      );
    }

    const saveResults: boolean[] = [];
    for (const contact of selectedContacts) {
      try {
        const input: NewContactParams = {
          companyId: company.id,
          name: contact.name,
          title: contact.title,
          department: normalizeOptionalText(contact.department),
          linkedinUrl: contact.linkedinUrl,
          contactStatus: "new",
          priority: "Low",
          lastContactedAt: null,
          notes: null,
        };
        const savedContact = await insertContact(input);
        saveResults.push(Boolean(savedContact));
      } catch (error) {
        console.error("Failed to save contact:", error);
        saveResults.push(false);
      }
    }

    const contactsSaved = saveResults.filter(Boolean).length;
    const contactsFailed = saveResults.length - contactsSaved;

    if (contactsSaved === 0) {
      return err(
        "DB_WRITE_FAILED",
        `Failed to save validated LinkedIn leads for ${company.companyName}.`,
        {
          companyId,
          companyName: company.companyName,
          contactsFound: selectedContacts.length,
          contactsSaved,
          contactsFailed,
        },
      );
    }

    return ok({
      companyId,
      companyName: company.companyName,
      contactsFound: selectedContacts.length,
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

import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/model";
import {
  formatExaResultsForPrompt,
  getExaContents,
} from "@/lib/server/services/search/exa";

export const maxDuration = 60;

const contactInfoSchema = z.object({
  name: z.string().describe("Full name of the person"),
  title: z
    .string()
    .describe("Job title (e.g., VP of Engineering, Senior Product Manager)"),
  department: z
    .string()
    .optional()
    .describe("Department or function (e.g., Engineering, Sales, Marketing)"),
  companyName: z
    .string()
    .optional()
    .describe("Company name where this person works"),
});

export async function POST(req: Request) {
  try {
    const { linkedinUrl } = await req.json();

    if (!linkedinUrl || !linkedinUrl.trim()) {
      return Response.json(
        { success: false, error: "LinkedIn URL is required" },
        { status: 400 },
      );
    }

    const profileContents = await getExaContents({
      urls: [linkedinUrl],
      text: {
        maxCharacters: 7000,
      },
      highlights: {
        maxCharacters: 1600,
        query:
          "Identify this person's full name, current role, department or function, and current employer.",
      },
    });

    if (profileContents.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No profile content found for the provided LinkedIn URL",
        },
        { status: 404 },
      );
    }

    const { object: contactInfo } = await generateObject({
      model: getChatModel(),
      schema: contactInfoSchema,
      schemaName: "ContactInfo",
      schemaDescription: "Information extracted from a LinkedIn profile",
      system: `You extract LinkedIn profile information from Exa page contents.
Use only the provided profile context.
If a field is not supported by the context, omit it.`,
      prompt: `LinkedIn profile URL: ${linkedinUrl}

${formatExaResultsForPrompt(profileContents, "Exa profile contents")}

Extract:
1. Full name
2. Current job title
3. Department/function, if identifiable
4. Current company name`,
    });

    return Response.json({
      success: true,
      data: contactInfo,
    });
  } catch (error) {
    console.error("Auto-fill contact error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to auto-fill contact",
      },
      { status: 500 },
    );
  }
}

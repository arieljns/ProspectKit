import { xai } from "@ai-sdk/xai";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 60;

const contactInfoSchema = z.object({
  name: z
    .string()
    .describe("Full name of the person"),
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
        { status: 400 }
      );
    }

    // Use an AI model with Live Search to extract LinkedIn profile information
    const { object: contactInfo } = await generateObject({
      model: xai("grok-4-fast-non-reasoning-latest"),
      schema: contactInfoSchema,
      schemaName: "ContactInfo",
      schemaDescription: "Information extracted from a LinkedIn profile",
      prompt: `Extract information from this LinkedIn profile: ${linkedinUrl}

Use Live Search to access the LinkedIn profile and extract:
1. Full name of the person
2. Current job title
3. Department/function (if identifiable from the title or profile)
4. Company name where they currently work

Be accurate and use real data from the LinkedIn profile.`,
      providerOptions: {
        xai: {
          searchParameters: {
            mode: "on",
            returnCitations: false,
            maxSearchResults: 3,
            sources: [
              {
                type: "web",
                allowedWebsites: ["linkedin.com"],
              },
            ],
          },
        },
      },
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
        error: error instanceof Error ? error.message : "Failed to auto-fill contact",
      },
      { status: 500 }
    );
  }
}

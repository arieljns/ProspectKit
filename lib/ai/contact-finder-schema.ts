import { z } from 'zod';

/**
 * Schema for AI-generated contact finder results
 * Used with an AI model + Live Search to find key contacts at a company
 */
export const contactFinderSchema = z.object({
  contacts: z
    .array(
      z.object({
        name: z
          .string()
          .describe('Full name of the contact (e.g., "Patrick Collison")'),
        title: z
          .string()
          .describe(
            'Job title at the company (e.g., "CEO & Co-founder", "Head of Sales")'
          ),
        department: z
          .string()
          .optional()
          .describe(
            'Department or functional area (e.g., "Engineering", "Sales", "Executive")'
          ),
        linkedinUrl: z
          .string()
          .url()
          .optional()
          .describe('LinkedIn profile URL if found on LinkedIn'),
      })
    )
    .max(5)
    .describe(
      'List of key contacts found at the company (maximum 5 contacts)'
    ),
});

export type ContactFinderResult = z.infer<typeof contactFinderSchema>;

import { sql } from "drizzle-orm";
import { text, jsonb, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Scoring configuration for lead qualification
 * Stores user's company info, product info, and scoring criteria
 */
export const scoringConfig = pgTable("scoring_config", {
  // Single global config (id is always 'default')
  id: text("id").primaryKey().default("default"),

  // User's company information
  userCompanyName: text("user_company_name").notNull(),
  userCompanyDescription: text("user_company_description").notNull(),

  // Product/Service information
  productDescription: text("product_description").notNull(),

  // Target customer profile
  targetIndustries: jsonb("target_industries")
    .notNull()
    .$type<string[]>()
    .default(sql`'[]'::jsonb`), // Array of industry names

  targetSeniorityLevels: jsonb("target_seniority_levels")
    .notNull()
    .$type<string[]>()
    .default(sql`'[]'::jsonb`), // ["C-level", "VP", "Director", "Manager", "Individual"]

  // Dimension weights (must sum to 100)
  weights: jsonb("weights")
    .notNull()
    .$type<{
      industryMatch: number;
      companyMatch: number;
      positionMatch: number;
      seniorityMatch: number;
      dealSizeMatch: number;
    }>()
    .default(
      sql`'{"industryMatch": 25, "companyMatch": 30, "positionMatch": 20, "seniorityMatch": 15, "dealSizeMatch": 10}'::jsonb`,
    ),

  // Metadata
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for updating config (manually defined because createSelectSchema doesn't work well with jsonb)
export const updateScoringConfigSchema = z.object({
  userCompanyName: z.string().min(1, "Company name is required"),
  userCompanyDescription: z.string().min(1, "Company description is required"),
  productDescription: z.string().min(1, "Product description is required"),
  targetIndustries: z.array(z.string()).min(1, "Select at least one industry"),
  targetSeniorityLevels: z
    .array(z.string())
    .min(1, "Select at least one seniority level"),
  weights: z.object({
    industryMatch: z.number().min(0).max(100),
    companyMatch: z.number().min(0).max(100),
    positionMatch: z.number().min(0).max(100),
    seniorityMatch: z.number().min(0).max(100),
    dealSizeMatch: z.number().min(0).max(100),
  }),
});

export type ScoringConfig = typeof scoringConfig.$inferSelect;
export type UpdateScoringConfigParams = z.infer<
  typeof updateScoringConfigSchema
>;

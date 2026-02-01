import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable, jsonb } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { nanoid } from "@/lib/utils";
import { companies } from "./companies";

// Report JSON structure (simplified)
export const reportDataSchema = z.object({
  companyName: z.string(),
  industry: z.string().optional(),
  size: z.string().optional(),

  summary: z.object({
    overview: z.string(),
    keyStrengths: z.array(z.string()),
    challenges: z.array(z.string()),
    marketPosition: z.string(),
  }),

  financials: z.object({
    revenue: z.string().optional(),
    funding: z.string().optional(),
    valuation: z.string().optional(),
  }).optional(),

  products: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.string(),
  })),

  marketAnalysis: z.object({
    targetMarket: z.string(),
    competitors: z.array(z.string()),
    marketSize: z.string(),
  }),

  recentNews: z.array(z.object({
    title: z.string(),
    url: z.string(),
  })).optional(),

  insights: z.object({
    opportunities: z.array(z.string()),
  }),
});

export type ReportData = z.infer<typeof reportDataSchema>;

export const companyReports = pgTable("company_reports", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  companyId: varchar("company_id", { length: 191 })
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),

  reportData: jsonb("report_data").notNull().$type<ReportData>(),

  status: text("status").notNull().default("generating"), // "generating" | "completed" | "failed"

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for inserting reports
export const insertReportSchema = createSelectSchema(companyReports)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

// Type for new report params
export type NewReportParams = z.infer<typeof insertReportSchema>;

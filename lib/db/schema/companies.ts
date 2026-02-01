import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { nanoid } from "@/lib/utils";

export const companies = pgTable("companies", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  companyName: text("company_name").notNull(),
  industry: text("industry"), // optional
  size: text("size"), // optional - e.g., "51-200"
  priority: text("priority").notNull().default("Low"), // "High" | "Medium" | "Low"
  reportStatus: text("report_status").notNull().default("none"), // "none" | "generating" | "completed" | "failed"
  website: text("website"), // optional
  description: text("description"), // optional

  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for inserting companies
export const insertCompanySchema = createSelectSchema(companies)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

// Type for new company params
export type NewCompanyParams = z.infer<typeof insertCompanySchema>;

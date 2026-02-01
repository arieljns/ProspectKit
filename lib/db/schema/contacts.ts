import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { nanoid } from "@/lib/utils";
import { companies } from "./companies";

export const contacts = pgTable("contacts", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),

  // Foreign key to companies table
  companyId: varchar("company_id", { length: 191 })
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),

  // Basic information
  name: text("name").notNull(), // Full name
  title: text("title").notNull(), // Job title (e.g., "VP of Engineering")
  department: text("department"), // Optional department (e.g., "Engineering", "Sales")

  // Contact information
  linkedinUrl: text("linkedin_url"), // Optional LinkedIn profile URL

  // SDR-specific fields
  contactStatus: text("contact_status")
    .notNull()
    .default("new"), // "new" | "contacted" | "responded" | "qualified" | "not_interested"
  priority: text("priority").notNull().default("Low"), // "High" | "Medium" | "Low"
  lastContactedAt: timestamp("last_contacted_at"), // Optional: when they were last contacted
  notes: text("notes"), // Optional sales notes

  // Metadata
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for inserting contacts
export const insertContactSchema = createSelectSchema(contacts)
  .extend({})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

// Type for new contact params
export type NewContactParams = z.infer<typeof insertContactSchema>;

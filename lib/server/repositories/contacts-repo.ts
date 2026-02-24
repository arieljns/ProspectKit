import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { contacts, type NewContactParams } from "@/lib/db/schema/contacts";
import { companies } from "@/lib/db/schema/companies";

export async function findContactWithCompanyById(contactId: string) {
  const [result] = await db
    .select({
      contact: contacts,
      company: companies,
    })
    .from(contacts)
    .leftJoin(companies, eq(contacts.companyId, companies.id))
    .where(eq(contacts.id, contactId))
    .limit(1);

  return result ?? null;
}

export async function insertContact(input: NewContactParams) {
  const [createdContact] = await db.insert(contacts).values(input).returning();
  return createdContact ?? null;
}

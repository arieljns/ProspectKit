import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema/companies";

export async function findCompanyById(companyId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  return company ?? null;
}

export async function setCompanyReportStatus(
  companyId: string,
  reportStatus: "none" | "generating" | "completed" | "failed",
) {
  const [updatedCompany] = await db
    .update(companies)
    .set({
      reportStatus,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId))
    .returning();

  return updatedCompany ?? null;
}

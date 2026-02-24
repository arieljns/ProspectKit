import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  companyReports,
  type ReportData,
} from "@/lib/db/schema/company-reports";

export async function findCompanyReportByCompanyId(companyId: string) {
  const [report] = await db
    .select()
    .from(companyReports)
    .where(eq(companyReports.companyId, companyId))
    .limit(1);

  return report ?? null;
}

export async function upsertCompanyReportByCompanyId(
  companyId: string,
  reportData: ReportData,
  status: "generating" | "completed" | "failed",
) {
  const existingReport = await findCompanyReportByCompanyId(companyId);

  if (!existingReport) {
    const [createdReport] = await db
      .insert(companyReports)
      .values({
        companyId,
        reportData,
        status,
      })
      .returning();

    return createdReport ?? null;
  }

  const [updatedReport] = await db
    .update(companyReports)
    .set({
      reportData,
      status,
      updatedAt: new Date(),
    })
    .where(eq(companyReports.id, existingReport.id))
    .returning();

  return updatedReport ?? null;
}

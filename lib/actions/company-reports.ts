'use server';

import { db } from '../db';
import { companyReports, type ReportData } from '../db/schema/company-reports';
import { companies } from '../db/schema/companies';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get report by company ID
 */
export const getReportByCompanyId = async (companyId: string) => {
  try {
    const [report] = await db
      .select()
      .from(companyReports)
      .where(eq(companyReports.companyId, companyId))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found' };
    }

    return { success: true, data: report };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch report',
    };
  }
};

/**
 * Create or update a report for a company
 * If report exists, it will be replaced (one report per company)
 */
export const createOrUpdateReport = async (
  companyId: string,
  reportData: ReportData
) => {
  try {
    // Check if report exists
    const [existingReport] = await db
      .select()
      .from(companyReports)
      .where(eq(companyReports.companyId, companyId))
      .limit(1);

    let report;

    if (existingReport) {
      // Update existing report
      [report] = await db
        .update(companyReports)
        .set({
          reportData,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(companyReports.id, existingReport.id))
        .returning();
    } else {
      // Create new report
      [report] = await db
        .insert(companyReports)
        .values({
          companyId,
          reportData,
          status: 'completed',
        })
        .returning();
    }

    // Update company report status
    await db
      .update(companies)
      .set({
        reportStatus: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    revalidatePath('/app/dashboard');
    revalidatePath(`/app/reports/${companyId}`);

    return { success: true, data: report };
  } catch (error) {
    // If failed, update company report status to failed
    await db
      .update(companies)
      .set({ reportStatus: 'failed' })
      .where(eq(companies.id, companyId))
      .catch(() => {});

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save report',
    };
  }
};

/**
 * Delete a report
 */
export const deleteReport = async (companyId: string) => {
  try {
    const [deletedReport] = await db
      .delete(companyReports)
      .where(eq(companyReports.companyId, companyId))
      .returning();

    if (!deletedReport) {
      return { success: false, error: 'Report not found' };
    }

    // Update company report status to none
    await db
      .update(companies)
      .set({
        reportStatus: 'none',
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    revalidatePath('/app/dashboard');
    revalidatePath(`/app/reports/${companyId}`);

    return { success: true, message: 'Report deleted successfully' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete report',
    };
  }
};

/**
 * Mark report as generating (called before generation starts)
 */
export const markReportAsGenerating = async (companyId: string) => {
  try {
    // Update company status
    await db
      .update(companies)
      .set({
        reportStatus: 'generating',
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));

    // Create report record with generating status
    const [existingReport] = await db
      .select()
      .from(companyReports)
      .where(eq(companyReports.companyId, companyId))
      .limit(1);

    if (!existingReport) {
      await db
        .insert(companyReports)
        .values({
          companyId,
          reportData: {} as ReportData, // Placeholder
          status: 'generating',
        });
    } else {
      await db
        .update(companyReports)
        .set({
          status: 'generating',
          updatedAt: new Date(),
        })
        .where(eq(companyReports.id, existingReport.id));
    }

    revalidatePath('/app/dashboard');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as generating',
    };
  }
};

import { findCompanyById } from "@/lib/server/repositories/companies-repo";
import { generateCompanyReport } from "@/lib/server/services/reports/generate-company-report";
import { findContactsForCompany } from "@/lib/server/services/contacts/find-contacts-for-company";
import { scoreLeadForContact } from "@/lib/server/services/leads/score-lead-for-contact";
import { toServiceJsonErrorResponse } from "@/lib/server/http/error-response";
import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema/contacts";
import { eq } from "drizzle-orm";

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { companyId?: string };

    // Validate input
    if (!body.companyId?.trim()) {
      return toServiceJsonErrorResponse({
        code: "INVALID_INPUT",
        message: "companyId is required",
      });
    }

    const companyId = body.companyId.trim();

    // Validate company exists
    const company = await findCompanyById(companyId);
    if (!company) {
      return toServiceJsonErrorResponse({
        code: "COMPANY_NOT_FOUND",
        message: "Company not found",
      });
    }

    type StepResult = {
      report: { success: boolean; error?: string };
      contacts: {
        success: boolean;
        found?: number;
        saved?: number;
        error?: string;
      };
      scoring: {
        success: boolean;
        scored?: number;
        failed?: number;
        error?: string;
      };
    };

    const result: StepResult = {
      report: { success: false },
      contacts: { success: false },
      scoring: { success: false },
    };

    // Step 1: Generate report
    const reportResult = await generateCompanyReport({ companyId });
    if (!reportResult.ok) {
      result.report = {
        success: false,
        error: reportResult.error.message,
      };
      // Stop — do not proceed to contacts/scoring
      return Response.json({
        success: false,
        steps: result,
      });
    }
    result.report = { success: true };

    // Step 2: Find contacts
    const contactsResult = await findContactsForCompany({ companyId });
    if (!contactsResult.ok) {
      result.contacts = {
        success: false,
        error: contactsResult.error.message,
      };
      // Stop — do not proceed to scoring
      return Response.json({
        success: false,
        steps: result,
      });
    }
    result.contacts = {
      success: true,
      found: contactsResult.data.contactsFound,
      saved: contactsResult.data.contactsSaved,
    };

    // Step 3: Score each contact
    const companyContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.companyId, companyId));

    let scoredCount = 0;
    let failedCount = 0;

    for (const contact of companyContacts) {
      const scoreResult = await scoreLeadForContact({ contactId: contact.id });
      if (scoreResult.ok) {
        scoredCount++;
      } else {
        failedCount++;
      }
    }

    result.scoring = {
      success: scoredCount > 0 || companyContacts.length === 0,
      scored: scoredCount,
      failed: failedCount,
    };

    const overallSuccess =
      result.report.success &&
      result.contacts.success &&
      result.scoring.success;

    return Response.json({
      success: overallSuccess,
      steps: result,
    });
  } catch (error) {
    console.error("Brief generation orchestration error:", error);
    return toServiceJsonErrorResponse({
      code: "UNKNOWN",
      message:
        error instanceof Error
          ? error.message
          : "Brief generation failed",
    });
  }
}

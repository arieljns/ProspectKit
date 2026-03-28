"use server";

import { findCompanyById } from "@/lib/server/repositories/companies-repo";
import { findCompanyReportByCompanyId } from "@/lib/server/repositories/company-reports-repo";
import { findContactsByCompanyId } from "@/lib/server/repositories/contacts-repo";
import { findLeadScoresByContactIds } from "@/lib/server/repositories/lead-scores-repo";
import { findDefaultScoringConfig } from "@/lib/server/repositories/scoring-config-repo";
import { calculateTotalScore, getScoreGrade, DEFAULT_WEIGHTS } from "@/lib/utils/scoring";
import { companies } from "@/lib/db/schema/companies";
import { contacts } from "@/lib/db/schema/contacts";
import { companyReports } from "@/lib/db/schema/company-reports";
import type { LeadScore } from "@/lib/db/schema/lead-scores";
import type { ScoringConfig } from "@/lib/db/schema/scoring-config";

type Company = typeof companies.$inferSelect;
type CompanyReport = typeof companyReports.$inferSelect;
type Contact = typeof contacts.$inferSelect;

export type RecommendedContact = {
  contact: Contact;
  score: LeadScore;
  totalScore: number;
  grade: "A" | "B" | "C";
};

export type BriefData = {
  company: Company;
  report: CompanyReport | null;
  contacts: Contact[];
  scores: LeadScore[];
  recommendations: RecommendedContact[];
  scoringConfig: ScoringConfig | null;
};

/**
 * Get all data needed to render the brief page in one call.
 * Returns company, report (null if not found), contacts (empty if none),
 * lead scores for those contacts (empty if none), and derived recommended contacts
 * (top 1-3 scored contacts sorted by weighted total score descending).
 */
export const getBriefData = async (
  companyId: string,
): Promise<
  | { success: true; data: BriefData }
  | { success: false; error: string }
> => {
  try {
    // Load company — required
    const company = await findCompanyById(companyId);

    if (!company) {
      return { success: false, error: "Company not found" };
    }

    // Load report — optional (null if not found)
    let report: CompanyReport | null = null;
    try {
      report = await findCompanyReportByCompanyId(companyId);
    } catch {
      report = null;
    }

    // Load contacts — empty array if none
    let companyContacts: Contact[] = [];
    try {
      companyContacts = await findContactsByCompanyId(companyId);
    } catch {
      companyContacts = [];
    }

    // Load lead scores for those contacts — empty array if none
    const contactIds = companyContacts.map((c) => c.id);
    let scores: LeadScore[] = [];
    try {
      scores = await findLeadScoresByContactIds(contactIds);
    } catch {
      scores = [];
    }

    // Load scoring config — null if not found
    let scoringConfigData: ScoringConfig | null = null;
    try {
      scoringConfigData = await findDefaultScoringConfig();
    } catch {
      scoringConfigData = null;
    }

    // Build a lookup map: contactId -> LeadScore
    const scoreByContactId = new Map<string, LeadScore>();
    for (const score of scores) {
      scoreByContactId.set(score.contactId, score);
    }

    // Derive recommended contacts: contacts with scores, sorted by total weighted score descending, capped at 3
    const scoredContacts: RecommendedContact[] = companyContacts
      .filter((contact) => scoreByContactId.has(contact.id))
      .map((contact) => {
        const score = scoreByContactId.get(contact.id)!;
        const totalScore = calculateTotalScore(
          {
            industryMatchScore: score.industryMatchScore,
            companyMatchScore: score.companyMatchScore,
            positionMatchScore: score.positionMatchScore,
            seniorityMatchScore: score.seniorityMatchScore,
            dealSizeScore: score.dealSizeScore,
          },
          DEFAULT_WEIGHTS,
        );
        const grade = getScoreGrade(totalScore);
        return { contact, score, totalScore, grade };
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);

    return {
      success: true,
      data: {
        company,
        report,
        contacts: companyContacts,
        scores,
        recommendations: scoredContacts,
        scoringConfig: scoringConfigData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load brief data",
    };
  }
};

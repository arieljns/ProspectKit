"use server";

import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema/contacts";
import { leadScores } from "@/lib/db/schema/lead-scores";
import { companies } from "@/lib/db/schema/companies";
import { count, eq, gte } from "drizzle-orm";
import { calculateTotalScore } from "@/lib/utils/scoring";
import { getScoringConfig } from "@/lib/actions/scoring-config";

/**
 * Get analytics data for the Pipeline Analytics page
 */
export async function getAnalyticsData() {
  try {
    // 1. Get total leads count
    const totalLeadsResult = await db.select({ count: count() }).from(contacts);
    const totalLeads = totalLeadsResult[0]?.count || 0;

    // 2. Get all contacts with their scores and companies
    const allContacts = await db
      .select({
        contactId: contacts.id,
        contactStatus: contacts.contactStatus,
        createdAt: contacts.createdAt,
        companyId: contacts.companyId,
        companyName: companies.companyName,
        industry: companies.industry,
        leadScore: {
          id: leadScores.id,
          industryMatchScore: leadScores.industryMatchScore,
          companyMatchScore: leadScores.companyMatchScore,
          positionMatchScore: leadScores.positionMatchScore,
          seniorityMatchScore: leadScores.seniorityMatchScore,
          dealSizeScore: leadScores.dealSizeScore,
        },
      })
      .from(contacts)
      .leftJoin(leadScores, eq(contacts.id, leadScores.contactId))
      .leftJoin(companies, eq(contacts.companyId, companies.id));

    // 3. Get scoring config weights (fallback to defaults if unavailable)
    const defaultWeights = {
      industryMatch: 25,
      companyMatch: 30,
      positionMatch: 20,
      seniorityMatch: 15,
      dealSizeMatch: 10,
    };
    const configResult = await getScoringConfig();
    const weights =
      configResult.success && configResult.data
        ? (configResult.data.weights as typeof defaultWeights)
        : defaultWeights;

    // 4. Calculate grade distribution
    let aGradeCount = 0;
    let bGradeCount = 0;
    let cGradeCount = 0;
    let notScoredCount = 0;

    allContacts.forEach((contact) => {
      if (!contact.leadScore?.id) {
        notScoredCount++;
        return;
      }

      const totalScore = calculateTotalScore(
        {
          industryMatchScore: contact.leadScore.industryMatchScore,
          companyMatchScore: contact.leadScore.companyMatchScore,
          positionMatchScore: contact.leadScore.positionMatchScore,
          seniorityMatchScore: contact.leadScore.seniorityMatchScore,
          dealSizeScore: contact.leadScore.dealSizeScore,
        },
        weights,
      );

      if (totalScore >= 85) aGradeCount++;
      else if (totalScore >= 70) bGradeCount++;
      else cGradeCount++;
    });

    // 5. Calculate status breakdown
    const statusBreakdown = {
      new: 0,
      contacted: 0,
      responded: 0,
      qualified: 0,
      not_interested: 0,
    };

    allContacts.forEach((contact) => {
      const status = contact.contactStatus as keyof typeof statusBreakdown;
      if (status in statusBreakdown) {
        statusBreakdown[status]++;
      }
    });

    // 6. Calculate rates
    const contactedCount = totalLeads - statusBreakdown.new;
    const contactedRate =
      totalLeads > 0 ? (contactedCount / totalLeads) * 100 : 0;
    const qualifiedRate =
      totalLeads > 0 ? (statusBreakdown.qualified / totalLeads) * 100 : 0;
    const aGradeRate = totalLeads > 0 ? (aGradeCount / totalLeads) * 100 : 0;

    // 7. Get leads over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentContacts = await db
      .select({
        id: contacts.id,
        createdAt: contacts.createdAt,
        leadScore: {
          id: leadScores.id,
          industryMatchScore: leadScores.industryMatchScore,
          companyMatchScore: leadScores.companyMatchScore,
          positionMatchScore: leadScores.positionMatchScore,
          seniorityMatchScore: leadScores.seniorityMatchScore,
          dealSizeScore: leadScores.dealSizeScore,
        },
      })
      .from(contacts)
      .leftJoin(leadScores, eq(contacts.id, leadScores.contactId))
      .where(gte(contacts.createdAt, thirtyDaysAgo))
      .orderBy(contacts.createdAt);

    // Group by date
    const leadsOverTime: { date: string; total: number; aGrade: number }[] = [];
    const dateMap = new Map<string, { total: number; aGrade: number }>();

    recentContacts.forEach((contact) => {
      const dateStr = contact.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { total: 0, aGrade: 0 });
      }

      const dateData = dateMap.get(dateStr)!;
      dateData.total++;

      // Check if this is an A-grade lead
      if (contact.leadScore?.id) {
        const totalScore = calculateTotalScore(
          {
            industryMatchScore: contact.leadScore.industryMatchScore,
            companyMatchScore: contact.leadScore.companyMatchScore,
            positionMatchScore: contact.leadScore.positionMatchScore,
            seniorityMatchScore: contact.leadScore.seniorityMatchScore,
            dealSizeScore: contact.leadScore.dealSizeScore,
          },
          weights,
        );

        if (totalScore >= 85) {
          dateData.aGrade++;
        }
      }
    });

    // Convert map to array and fill missing dates
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const data = dateMap.get(dateStr) || { total: 0, aGrade: 0 };
      leadsOverTime.push({
        date: dateStr,
        total: data.total,
        aGrade: data.aGrade,
      });
    }

    // 8. Get top companies by lead count
    const companyLeadCounts = new Map<
      string,
      {
        name: string;
        count: number;
        aCount: number;
        bCount: number;
        cCount: number;
      }
    >();

    allContacts.forEach((contact) => {
      const companyName = contact.companyName || "Unknown";

      if (!companyLeadCounts.has(companyName)) {
        companyLeadCounts.set(companyName, {
          name: companyName,
          count: 0,
          aCount: 0,
          bCount: 0,
          cCount: 0,
        });
      }

      const companyData = companyLeadCounts.get(companyName)!;
      companyData.count++;

      if (contact.leadScore?.id) {
        const totalScore = calculateTotalScore(
          {
            industryMatchScore: contact.leadScore.industryMatchScore,
            companyMatchScore: contact.leadScore.companyMatchScore,
            positionMatchScore: contact.leadScore.positionMatchScore,
            seniorityMatchScore: contact.leadScore.seniorityMatchScore,
            dealSizeScore: contact.leadScore.dealSizeScore,
          },
          weights,
        );

        if (totalScore >= 85) companyData.aCount++;
        else if (totalScore >= 70) companyData.bCount++;
        else companyData.cCount++;
      }
    });

    const topCompanies = Array.from(companyLeadCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 9. Get top industries by lead count
    const industryLeadCounts = new Map<string, number>();

    allContacts.forEach((contact) => {
      const industry = contact.industry || "Unknown";
      industryLeadCounts.set(
        industry,
        (industryLeadCounts.get(industry) || 0) + 1,
      );
    });

    const topIndustries = Array.from(industryLeadCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      data: {
        // KPI metrics
        totalLeads,
        aGradeCount,
        aGradeRate,
        contactedRate,
        qualifiedRate,

        // Score distribution
        scoreDistribution: {
          aGrade: aGradeCount,
          bGrade: bGradeCount,
          cGrade: cGradeCount,
          notScored: notScoredCount,
        },

        // Status breakdown
        statusBreakdown,

        // Time series
        leadsOverTime,

        // Top companies and industries
        topCompanies,
        topIndustries,
      },
    };
  } catch (error) {
    console.error("Failed to get analytics data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get analytics data",
    };
  }
}

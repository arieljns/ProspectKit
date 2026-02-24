import { SectionCards } from "@/components/workspace/analytics/section-cards";
import { SiteHeader } from "@/components/workspace/layout/site-header";
import { LeadStatusFunnel } from "@/components/workspace/analytics/lead-status-funnel";
import { ScoreDistributionChart } from "@/components/workspace/analytics/score-distribution-chart";
import { LeadsOverTimeChart } from "@/components/workspace/analytics/leads-over-time-chart";
import { getAnalyticsData } from "@/lib/actions/analytics";

// Force dynamic rendering to ensure data is always fresh
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage() {
  const result = await getAnalyticsData();

  // Provide default data if fetch fails
  const analyticsData =
    result.success && result.data
      ? result.data
      : {
          totalLeads: 0,
          aGradeCount: 0,
          aGradeRate: 0,
          contactedRate: 0,
          qualifiedRate: 0,
          scoreDistribution: { aGrade: 0, bGrade: 0, cGrade: 0, notScored: 0 },
          statusBreakdown: {
            new: 0,
            contacted: 0,
            responded: 0,
            qualified: 0,
            not_interested: 0,
          },
          leadsOverTime: [],
          topCompanies: [],
          topIndustries: [],
        };

  return (
    <>
      <SiteHeader title="Pipeline Analytics" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* KPI Cards */}
            <SectionCards data={analyticsData} />

            {/* Two-column charts: Funnel and Score Distribution */}
            <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
              <LeadStatusFunnel data={analyticsData.statusBreakdown} />
              <ScoreDistributionChart data={analyticsData.scoreDistribution} />
            </div>

            {/* Full-width chart: Leads Over Time */}
            <div className="px-4 lg:px-6">
              <LeadsOverTimeChart data={analyticsData.leadsOverTime} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

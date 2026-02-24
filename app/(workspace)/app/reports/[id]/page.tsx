import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/shared/ui/button";
import { CompanyReportView } from "@/components/workspace/reports/company-report-view";
import { SiteHeader } from "@/components/workspace/layout/site-header";
import { getCompanyById } from "@/lib/actions/companies";
import { getReportByCompanyId } from "@/lib/actions/company-reports";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch company and report
  const [companyResult, reportResult] = await Promise.all([
    getCompanyById(id),
    getReportByCompanyId(id),
  ]);

  // Handle errors
  if (!companyResult.success || !reportResult.success) {
    notFound();
  }

  const company = companyResult.data!;
  const report = reportResult.data!;

  return (
    <>
      <SiteHeader title="Company Report" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 py-6 px-4 lg:px-6 max-w-5xl mx-auto w-full">
            {/* Back Button */}
            <div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/dashboard" className="gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>

            {/* Report Content */}
            <CompanyReportView report={report.reportData} />
          </div>
        </div>
      </div>
    </>
  );
}

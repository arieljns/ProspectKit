import { CompanyResearchTable } from "@/components/workspace/companies/company-research-table";
import { SiteHeader } from "@/components/workspace/layout/site-header";
import { getAllCompanies } from "@/lib/actions/companies";
import { Company } from "@/components/workspace/companies/company-research-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const result = await getAllCompanies();
  const companies = result.success ? result.data : [];

  return (
    <>
      <SiteHeader title="Discover Companies" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <CompanyResearchTable data={companies as Company[]} />
          </div>
        </div>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { getBriefData } from "@/lib/actions/briefs";
import { BriefHeader } from "@/components/workspace/brief/brief-header";
import { ResearchSection } from "@/components/workspace/brief/research-section";
import { ContactsSection } from "@/components/workspace/brief/contacts-section";
import { ScoringSection } from "@/components/workspace/brief/scoring-section";
import { OutreachSection } from "@/components/workspace/brief/outreach-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BriefPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function BriefPage({ params }: BriefPageProps) {
  const { companyId } = await params;

  const result = await getBriefData(companyId);

  if (!result.success) {
    if (result.error === "Company not found") {
      notFound();
    }

    // For other errors, show a friendly error state
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">
          Something went wrong loading this company brief.
        </p>
        <Link
          href="/app/dashboard"
          className="text-sm text-primary underline hover:no-underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const briefData = result.data;

  return (
    <>
      <BriefHeader data={briefData} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
            <ResearchSection
              companyId={briefData.company.id}
              initialReport={briefData.report?.reportData ?? null}
              reportStatus={briefData.report?.status ?? "none"}
            />
            <ContactsSection />
            <ScoringSection />
            <OutreachSection />
          </div>
        </div>
      </div>
    </>
  );
}

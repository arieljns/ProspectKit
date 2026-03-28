import { notFound } from "next/navigation";
import Link from "next/link";
import { getBriefData } from "@/lib/actions/briefs";
import { BriefRunController } from "@/components/workspace/brief/brief-run-controller";

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

  return <BriefRunController initialData={result.data} />;
}

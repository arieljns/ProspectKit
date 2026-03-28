import Link from "next/link";
import { Building2Icon } from "lucide-react";
import { Button } from "@/components/shared/ui/button";

export default function BriefNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <Building2Icon className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Company not found</h1>
        <p className="max-w-sm text-muted-foreground">
          The company you&apos;re looking for doesn&apos;t exist or may have been
          removed.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/app/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}

import { MessageSquareIcon } from "lucide-react";

export function OutreachSection() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Outreach</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        No outreach messages yet. Complete research and scoring to generate personalized outreach.
      </p>
    </div>
  );
}

import { FileTextIcon } from "lucide-react";

export function ResearchSection() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <FileTextIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Research</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        No research report yet. Generate a brief to start researching this company.
      </p>
    </div>
  );
}

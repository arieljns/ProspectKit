import { BarChart3Icon } from "lucide-react";

export function ScoringSection() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2">
        <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Lead Scoring</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        No scores yet. Generate a brief to score and rank contacts by their fit.
      </p>
    </div>
  );
}

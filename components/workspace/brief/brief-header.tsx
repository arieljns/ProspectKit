"use client";

import { Building2Icon, ExternalLinkIcon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/shared/ui/badge";
import { Button } from "@/components/shared/ui/button";
import { Separator } from "@/components/shared/ui/separator";
import { SidebarTrigger } from "@/components/shared/ui/sidebar";
import { cn } from "@/lib/utils";
import type { BriefData } from "@/lib/actions/briefs";

type BriefCompletionState = "not_started" | "in_progress" | "complete";

function getBriefCompletionState(data: BriefData): BriefCompletionState {
  const hasReport = data.report !== null;
  const hasContacts = data.contacts.length > 0;
  const hasScores = data.scores.length > 0;

  if (hasReport && hasContacts && hasScores) {
    return "complete";
  }

  if (hasReport || hasContacts || hasScores) {
    return "in_progress";
  }

  return "not_started";
}

function getPriorityVariant(
  priority: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "High":
      return "destructive";
    case "Medium":
      return "default";
    case "Low":
      return "secondary";
    default:
      return "outline";
  }
}

function CompletionIndicator({ state }: { state: BriefCompletionState }) {
  const config = {
    not_started: {
      label: "Not started",
      className: "bg-muted text-muted-foreground",
    },
    in_progress: {
      label: "In progress",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    complete: {
      label: "Complete",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
  };

  const { label, className } = config[state];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
    >
      {label}
    </span>
  );
}

type BriefHeaderProps = {
  data: BriefData;
  onGenerateBrief?: () => void;
  isRunning?: boolean;
};

export function BriefHeader({ data, onGenerateBrief, isRunning = false }: BriefHeaderProps) {
  const { company } = data;
  const completionState = getBriefCompletionState(data);

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-auto flex shrink-0 flex-col gap-0 border-b bg-background">
      {/* Top bar with sidebar trigger */}
      <div className="flex h-12 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <span className="text-sm text-muted-foreground">Company Brief</span>
      </div>

      {/* Company info section */}
      <div className="flex flex-col gap-4 px-4 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          {/* Company name */}
          <div className="flex items-center gap-2">
            <Building2Icon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">
              {company.companyName}
            </h1>
          </div>

          {/* Meta fields row */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {company.industry && (
              <>
                <span>{company.industry}</span>
                <span className="text-border">·</span>
              </>
            )}
            {company.size && (
              <>
                <span>{company.size} employees</span>
                <span className="text-border">·</span>
              </>
            )}
            {company.website && (
              <>
                <a
                  href={
                    company.website.startsWith("http")
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {company.website}
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
                <span className="text-border">·</span>
              </>
            )}
            <Badge variant={getPriorityVariant(company.priority)} className="text-xs">
              {company.priority} priority
            </Badge>
          </div>

          {/* Completion indicator + timestamp */}
          <div className="flex items-center gap-2">
            <CompletionIndicator state={completionState} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              Updated just now
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex shrink-0 items-start">
          <Button
            size="default"
            onClick={onGenerateBrief}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? "Generating…" : "Generate Brief"}
          </Button>
        </div>
      </div>
    </header>
  );
}

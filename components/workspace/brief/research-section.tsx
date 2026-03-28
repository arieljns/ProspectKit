"use client";

import { useState } from "react";
import {
  FileTextIcon,
  RefreshCwIcon,
  PlayIcon,
  RotateCcwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Skeleton } from "@/components/shared/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import type { SectionState } from "./types";
import type { ReportData } from "@/lib/db/schema/company-reports";
import { getBriefData } from "@/lib/actions/briefs";

type ResearchSectionProps = {
  companyId: string;
  initialReport: ReportData | null;
  reportStatus: string;
  onComplete?: (success: boolean) => void;
  onStateChange?: (state: SectionState) => void;
};

function deriveInitialState(
  report: ReportData | null,
  reportStatus: string,
): SectionState {
  if (!report) return "empty";
  if (reportStatus === "generating") return "running";
  if (reportStatus === "completed") return "success";
  if (reportStatus === "failed") return "error";
  return "empty";
}

export function ResearchSection({
  companyId,
  initialReport,
  reportStatus,
  onComplete,
  onStateChange,
}: ResearchSectionProps) {
  const [state, setState] = useState<SectionState>(() =>
    deriveInitialState(initialReport, reportStatus),
  );
  const [reportData, setReportData] = useState<ReportData | null>(
    initialReport,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatedJustNow, setUpdatedJustNow] = useState(false);

  const updateState = (newState: SectionState) => {
    setState(newState);
    onStateChange?.(newState);
  };

  const handleRun = async () => {
    updateState("running");
    setErrorMessage(null);
    setUpdatedJustNow(false);

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        throw new Error("Generation request failed");
      }

      const json = (await response.json()) as { success: boolean };

      if (!json.success) {
        throw new Error("Report generation was unsuccessful");
      }

      // Fetch the updated brief data to get the new report
      const briefResult = await getBriefData(companyId);
      if (briefResult.success && briefResult.data.report?.reportData) {
        setReportData(briefResult.data.report.reportData);
        updateState("success");
        setUpdatedJustNow(true);
        onComplete?.(true);
      } else {
        throw new Error("Failed to retrieve updated report");
      }
    } catch {
      updateState("error");
      setErrorMessage(
        "We couldn't generate the research report. Please try again.",
      );
      onComplete?.(false);
    }
  };

  const isRunning = state === "running";

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Research</h2>
        </div>

        {/* Action button */}
        {state === "empty" && (
          <Button size="sm" onClick={handleRun} disabled={isRunning}>
            <PlayIcon className="h-4 w-4" />
            Generate Report
          </Button>
        )}
        {state === "running" && (
          <Button size="sm" disabled>
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            Generating…
          </Button>
        )}
        {state === "success" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRun}
            disabled={isRunning}
          >
            <RotateCcwIcon className="h-4 w-4" />
            Rerun
          </Button>
        )}
        {state === "error" && (
          <Button size="sm" onClick={handleRun} disabled={isRunning}>
            <RotateCcwIcon className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>

      {/* Error banner (shown in error state; prior report shown below if available) */}
      {state === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {errorMessage ??
              "We couldn't generate the research report. Please try again."}
          </p>
        </div>
      )}

      {/* Empty state */}
      {state === "empty" && (
        <p className="text-sm text-muted-foreground">
          No research report yet. Click &quot;Generate Report&quot; to start
          researching this company.
        </p>
      )}

      {/* Running state (loading skeleton) */}
      {state === "running" && !reportData && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      )}

      {/* Report content (shown in success state, and in error state if prior data exists) */}
      {(state === "success" || (state === "error" && reportData)) &&
        reportData && (
          <div className="flex flex-col gap-4">
            {/* Updated indicator */}
            {updatedJustNow && state === "success" && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ClockIcon className="h-3 w-3" />
                Updated just now
              </div>
            )}

            {/* Overview */}
            {reportData.summary?.overview && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Overview
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {reportData.summary.overview}
                </p>
              </div>
            )}

            {/* Key strengths & challenges */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {reportData.summary?.keyStrengths &&
                reportData.summary.keyStrengths.length > 0 && (
                  <Card className="border-green-200 dark:border-green-900/50">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-green-700 dark:text-green-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        Key Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <ul className="flex flex-col gap-1">
                        {reportData.summary.keyStrengths.map(
                          (strength, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-1.5 text-sm"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                              {strength}
                            </li>
                          ),
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}

              {reportData.summary?.challenges &&
                reportData.summary.challenges.length > 0 && (
                  <Card className="border-orange-200 dark:border-orange-900/50">
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-orange-700 dark:text-orange-400">
                        <ShieldAlertIcon className="h-4 w-4" />
                        Challenges
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                      <ul className="flex flex-col gap-1">
                        {reportData.summary.challenges.map(
                          (challenge, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-1.5 text-sm"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                              {challenge}
                            </li>
                          ),
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
            </div>

            {/* Market position */}
            {reportData.summary?.marketPosition && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Market Position
                </p>
                <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
                  <TrendingUpIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm leading-relaxed text-foreground">
                    {reportData.summary.marketPosition}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Running with prior data: show skeleton overlay */}
      {state === "running" && reportData && (
        <div className="flex flex-col gap-3 opacity-50">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

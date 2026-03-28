"use client";

import { useState } from "react";
import {
  BarChart3Icon,
  PlayIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  AlertCircleIcon,
  UserIcon,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { Badge } from "@/components/shared/ui/badge";
import { getBriefData } from "@/lib/actions/briefs";
import {
  calculateTotalScore,
  getScoreGrade,
  getGradeBadgeVariant,
} from "@/lib/utils/scoring";
import type { SectionState } from "./types";
import type { contacts } from "@/lib/db/schema/contacts";
import type { LeadScore } from "@/lib/db/schema/lead-scores";
import type { ScoringConfig } from "@/lib/db/schema/scoring-config";

type Contact = typeof contacts.$inferSelect;

/**
 * Default scoring weights used when no scoring config is available
 */
const DEFAULT_WEIGHTS = {
  industryMatch: 25,
  companyMatch: 30,
  positionMatch: 20,
  seniorityMatch: 15,
  dealSizeMatch: 10,
};

type ScoredContact = {
  contact: Contact;
  score: LeadScore;
  totalScore: number;
  grade: "A" | "B" | "C";
};

type ScoringSectionProps = {
  companyId: string;
  initialContacts: Contact[];
  initialScores: LeadScore[];
  scoringConfig: ScoringConfig | null;
  onComplete?: (success: boolean) => void;
  onStateChange?: (state: SectionState) => void;
  /** When set, overrides the section's internal state (used by BriefRunController during orchestration) */
  externalState?: SectionState;
  /** When set, provides live scores during orchestration (e.g., incrementally updated) */
  externalScores?: LeadScore[];
};

function deriveInitialState(
  contacts: Contact[],
  scores: LeadScore[],
): SectionState {
  if (contacts.length === 0) return "empty";
  if (scores.length > 0) return "success";
  return "empty";
}

function buildScoredContacts(
  contacts: Contact[],
  scores: LeadScore[],
  weights: ScoringConfig["weights"],
): ScoredContact[] {
  const scoreByContactId = new Map<string, LeadScore>();
  for (const score of scores) {
    scoreByContactId.set(score.contactId, score);
  }

  return contacts
    .filter((contact) => scoreByContactId.has(contact.id))
    .map((contact) => {
      const score = scoreByContactId.get(contact.id)!;
      const totalScore = calculateTotalScore(
        {
          industryMatchScore: score.industryMatchScore,
          companyMatchScore: score.companyMatchScore,
          positionMatchScore: score.positionMatchScore,
          seniorityMatchScore: score.seniorityMatchScore,
          dealSizeScore: score.dealSizeScore,
        },
        weights,
      );
      const grade = getScoreGrade(totalScore);
      return { contact, score, totalScore, grade };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function ScoringSection({
  companyId,
  initialContacts,
  initialScores,
  scoringConfig,
  onComplete,
  onStateChange,
  externalState,
  externalScores,
}: ScoringSectionProps) {
  const weights = scoringConfig?.weights ?? DEFAULT_WEIGHTS;

  const [internalState, setInternalState] = useState<SectionState>(() =>
    deriveInitialState(initialContacts, initialScores),
  );
  const [contactsList, setContactsList] = useState<Contact[]>(initialContacts);
  const [scoresList, setScoresList] = useState<LeadScore[]>(initialScores);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use externalState if provided (during orchestration), else internal state
  const state = externalState ?? internalState;
  // Use externalScores if provided (for incremental updates during orchestration)
  const displayScores = externalScores ?? scoresList;

  const updateState = (newState: SectionState) => {
    setInternalState(newState);
    onStateChange?.(newState);
  };

  const handleRun = async () => {
    updateState("running");
    setErrorMessage(null);

    // We'll score contacts sequentially; track partial failures
    let anySuccess = false;
    let anyFailure = false;
    const newScores: LeadScore[] = [...scoresList];

    for (const contact of contactsList) {
      try {
        const response = await fetch("/api/leads/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: contact.id }),
        });

        if (!response.ok) {
          anyFailure = true;
          continue;
        }

        const json = (await response.json()) as {
          success: boolean;
          data?: LeadScore;
        };

        if (!json.success || !json.data) {
          anyFailure = true;
          continue;
        }

        // Upsert the score in local state so UI updates incrementally
        const updatedScore = json.data;
        const existingIndex = newScores.findIndex(
          (s) => s.contactId === contact.id,
        );
        if (existingIndex >= 0) {
          newScores[existingIndex] = updatedScore;
        } else {
          newScores.push(updatedScore);
        }

        // Update scores state incrementally as each contact is scored
        setScoresList([...newScores]);
        anySuccess = true;
      } catch {
        anyFailure = true;
      }
    }

    if (anySuccess) {
      // Refresh contacts from server to ensure we have fresh data
      try {
        const briefResult = await getBriefData(companyId);
        if (briefResult.success) {
          setContactsList(briefResult.data.contacts);
          setScoresList(briefResult.data.scores);
        }
      } catch {
        // Keep local state if refresh fails
      }

      if (anyFailure) {
        // Partial success: show scores we got, but surface error
        updateState("success");
        setErrorMessage(
          "Some contacts couldn't be scored. The scores shown are for contacts that were successfully scored.",
        );
      } else {
        updateState("success");
      }
      onComplete?.(true);
    } else {
      updateState("error");
      setErrorMessage(
        "We couldn't score the contacts. Please try again.",
      );
      onComplete?.(false);
    }
  };

  const isRunning = state === "running";
  const hasNoContacts = contactsList.length === 0;

  const scoredContacts = buildScoredContacts(contactsList, displayScores, weights);
  const unscoredContacts = contactsList.filter(
    (c) => !displayScores.some((s) => s.contactId === c.id),
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Lead Scoring</h2>
          {state === "success" && scoredContacts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {scoredContacts.length}
            </Badge>
          )}
        </div>

        {/* Action button */}
        {state === "empty" && (
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning || hasNoContacts}
          >
            <PlayIcon className="h-4 w-4" />
            Score
          </Button>
        )}
        {state === "running" && (
          <Button size="sm" disabled>
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            Scoring…
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
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning || hasNoContacts}
          >
            <RotateCcwIcon className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>

      {/* Error banner */}
      {(state === "error" ||
        (state === "success" && errorMessage)) && errorMessage && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Empty state: no contacts at all */}
      {state === "empty" && hasNoContacts && (
        <p className="text-sm text-muted-foreground">
          No contacts discovered yet. Discover contacts first, then score them
          to rank by fit.
        </p>
      )}

      {/* Empty state: contacts exist but not scored */}
      {state === "empty" && !hasNoContacts && (
        <p className="text-sm text-muted-foreground">
          {contactsList.length}{" "}
          {contactsList.length === 1 ? "contact" : "contacts"} ready to score.
          Click &quot;Score&quot; to rank them by fit.
        </p>
      )}

      {/* Running state (loading skeletons when no prior scores) */}
      {state === "running" && displayScores.length === 0 && (
        <div className="flex flex-col gap-2">
          {contactsList.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      )}

      {/* Running with prior scores: show faded scored contacts */}
      {state === "running" && displayScores.length > 0 && (
        <div className="flex flex-col gap-2 opacity-50">
          {scoredContacts.map((item) => (
            <ScoredContactCard key={item.contact.id} item={item} />
          ))}
        </div>
      )}

      {/* Success state (and error state with prior scores) */}
      {(state === "success" ||
        (state === "error" && scoredContacts.length > 0)) &&
        scoredContacts.length > 0 && (
          <div className="flex flex-col gap-2">
            {scoredContacts.map((item) => (
              <ScoredContactCard key={item.contact.id} item={item} />
            ))}

            {/* Unscored contacts (partial failure or contacts added after scoring) */}
            {unscoredContacts.length > 0 && (
              <div className="mt-1 flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Not yet scored
                </p>
                {unscoredContacts.map((contact) => (
                  <UnscoredContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            )}
          </div>
        )}

      {/* Success state with no scored contacts */}
      {state === "success" && scoredContacts.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No contacts were scored.
        </p>
      )}
    </div>
  );
}

function ScoredContactCard({ item }: { item: ScoredContact }) {
  const { contact, score, totalScore, grade } = item;
  const badgeVariant = getGradeBadgeVariant(grade);

  // Build reasoning summary from the first non-empty reasoning entry
  const reasoning = score.reasoning;
  const reasoningSummary = reasoning
    ? Object.values(reasoning).find((r) => r && r.trim().length > 0) ?? null
    : null;

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
      {/* Avatar placeholder */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <UserIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Contact info */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate">{contact.name}</span>
          <Badge variant={badgeVariant}>{grade}</Badge>
        </div>
        <span className="text-xs text-muted-foreground truncate">
          {contact.title}
          {contact.department ? ` · ${contact.department}` : ""}
        </span>
        {reasoningSummary && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {reasoningSummary}
          </p>
        )}
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <span className="text-sm font-bold tabular-nums">{totalScore}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function UnscoredContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background/60 p-3 opacity-60">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <UserIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold truncate">{contact.name}</span>
        <span className="text-xs text-muted-foreground truncate">
          {contact.title}
          {contact.department ? ` · ${contact.department}` : ""}
        </span>
      </div>
    </div>
  );
}

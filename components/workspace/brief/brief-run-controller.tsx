"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BriefHeader } from "./brief-header";
import { ResearchSection } from "./research-section";
import { ContactsSection } from "./contacts-section";
import { ScoringSection } from "./scoring-section";
import { OutreachSection } from "./outreach-section";
import type { SectionState } from "./types";
import type { BriefData, RecommendedContact } from "@/lib/actions/briefs";
import type { contacts } from "@/lib/db/schema/contacts";
import type { LeadScore } from "@/lib/db/schema/lead-scores";
import type { ScoringConfig } from "@/lib/db/schema/scoring-config";
import type { ReportData } from "@/lib/db/schema/company-reports";
import { getBriefData } from "@/lib/actions/briefs";

type Contact = typeof contacts.$inferSelect;

type BriefRunControllerProps = {
  initialData: BriefData;
};

/**
 * BriefRunController manages the full Generate Brief orchestration flow.
 *
 * Strategy: call individual section APIs sequentially (not the /api/briefs/generate
 * orchestration route), so each section transitions through running → success/error
 * as its step executes, giving progressive visual feedback.
 *
 * The orchestration route (/api/briefs/generate) still exists for curl/API consumers.
 */
export function BriefRunController({ initialData }: BriefRunControllerProps) {
  const router = useRouter();

  // All data in controller state (so we can update after orchestration)
  const [reportData, setReportData] = useState<ReportData | null>(
    initialData.report?.reportData ?? null,
  );
  const [reportStatus, setReportStatus] = useState<string>(
    initialData.report?.status ?? "none",
  );
  const [contactsList, setContactsList] = useState<Contact[]>(
    initialData.contacts,
  );
  const [scoresList, setScoresList] = useState<LeadScore[]>(initialData.scores);
  const [scoringConfig] = useState<ScoringConfig | null>(
    initialData.scoringConfig,
  );
  const [recommendations, setRecommendations] = useState<RecommendedContact[]>(
    initialData.recommendations,
  );

  // Section states for header completion indicator
  const [sectionStates, setSectionStates] = useState(() => ({
    research: deriveResearchState(
      initialData.report?.reportData ?? null,
      initialData.report?.status ?? "none",
    ),
    contacts: deriveContactsState(initialData.contacts),
    scoring: deriveScoringState(
      initialData.contacts,
      initialData.scores,
    ),
  }));

  // Key bump forces sections to re-mount with updated data after orchestration
  const [dataVersion, setDataVersion] = useState(0);

  // Whether full brief generation is running
  const [isRunning, setIsRunning] = useState(false);

  const updateSectionState = useCallback(
    (section: "research" | "contacts" | "scoring", state: SectionState) => {
      setSectionStates((prev) => ({ ...prev, [section]: state }));
    },
    [],
  );

  const refreshData = useCallback(async () => {
    try {
      const result = await getBriefData(initialData.company.id);
      if (result.success) {
        setReportData(result.data.report?.reportData ?? null);
        setReportStatus(result.data.report?.status ?? "none");
        setContactsList(result.data.contacts);
        setScoresList(result.data.scores);
        setRecommendations(result.data.recommendations);
        // Bump dataVersion so sections re-mount with fresh initial data
        setDataVersion((v) => v + 1);
        // Also signal Next.js to refresh the RSC cache
        router.refresh();
      }
    } catch {
      // Silently handle refresh errors
    }
  }, [initialData.company.id, router]);

  /**
   * Full Generate Brief orchestration:
   * 1. Report → update research section state
   * 2. If success: Contacts → update contacts section state
   * 3. If success: Score each contact → update scoring section state incrementally
   * 4. Refresh all data
   */
  const handleGenerateBrief = async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      // ── Step 1: Research ─────────────────────────────────────────────────
      updateSectionState("research", "running");

      const reportResp = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: initialData.company.id }),
      });

      const reportOk =
        reportResp.ok &&
        ((await reportResp.json()) as { success?: boolean }).success === true;

      if (!reportOk) {
        updateSectionState("research", "error");
        // Contacts and scoring remain in their prior state (not error)
        return;
      }

      updateSectionState("research", "success");

      // Fetch updated report data for display
      const afterReport = await getBriefData(initialData.company.id);
      if (afterReport.success) {
        setReportData(afterReport.data.report?.reportData ?? null);
        setReportStatus(afterReport.data.report?.status ?? "none");
      }

      // ── Step 2: Contacts ─────────────────────────────────────────────────
      updateSectionState("contacts", "running");

      const contactsResp = await fetch("/api/contacts/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: initialData.company.id }),
      });

      const contactsOk =
        contactsResp.ok &&
        ((await contactsResp.json()) as { success?: boolean }).success === true;

      if (!contactsOk) {
        updateSectionState("contacts", "error");
        // Scoring remains in its prior state (not error)
        return;
      }

      updateSectionState("contacts", "success");

      // Fetch updated contacts for display
      const afterContacts = await getBriefData(initialData.company.id);
      if (afterContacts.success) {
        setContactsList(afterContacts.data.contacts);
      }
      const contactsToScore = afterContacts.success
        ? afterContacts.data.contacts
        : contactsList;

      // ── Step 3: Scoring ──────────────────────────────────────────────────
      updateSectionState("scoring", "running");

      if (contactsToScore.length === 0) {
        updateSectionState("scoring", "empty");
        await refreshData();
        return;
      }

      let anyScoringSuccess = false;
      const updatedScores: LeadScore[] = [...scoresList];

      for (const contact of contactsToScore) {
        try {
          const scoreResp = await fetch("/api/leads/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactId: contact.id }),
          });

          if (scoreResp.ok) {
            const json = (await scoreResp.json()) as {
              success: boolean;
              data?: LeadScore;
            };
            if (json.success && json.data) {
              const idx = updatedScores.findIndex(
                (s) => s.contactId === contact.id,
              );
              if (idx >= 0) {
                updatedScores[idx] = json.data;
              } else {
                updatedScores.push(json.data);
              }
              setScoresList([...updatedScores]);
              anyScoringSuccess = true;
            }
          }
        } catch {
          // Continue scoring others on failure
        }
      }

      updateSectionState("scoring", anyScoringSuccess ? "success" : "error");

      // Final data refresh (also updates recommendations for outreach)
      await refreshData();
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Build a BriefData shape for BriefHeader so the completion indicator
   * reflects actual section states, not just initial data.
   */
  const headerData: BriefData = {
    company: initialData.company,
    report:
      sectionStates.research === "success"
        ? {
            id: "",
            companyId: initialData.company.id,
            status: "completed",
            reportData: reportData ?? ({} as ReportData),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    contacts: sectionStates.contacts === "success" ? contactsList : [],
    scores: sectionStates.scoring === "success" ? scoresList : [],
    recommendations,
    scoringConfig,
  };

  return (
    <>
      <BriefHeader
        data={headerData}
        onGenerateBrief={handleGenerateBrief}
        isRunning={isRunning}
      />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
            <ResearchSection
              key={`research-${dataVersion}`}
              companyId={initialData.company.id}
              initialReport={reportData}
              reportStatus={reportStatus}
              externalState={isRunning ? sectionStates.research : undefined}
              onStateChange={(state) => {
                if (!isRunning) {
                  updateSectionState("research", state);
                }
              }}
            />
            <ContactsSection
              key={`contacts-${dataVersion}`}
              companyId={initialData.company.id}
              initialContacts={contactsList}
              externalState={isRunning ? sectionStates.contacts : undefined}
              onStateChange={(state) => {
                if (!isRunning) {
                  updateSectionState("contacts", state);
                }
              }}
            />
            <ScoringSection
              key={`scoring-${dataVersion}`}
              companyId={initialData.company.id}
              initialContacts={contactsList}
              initialScores={scoresList}
              scoringConfig={scoringConfig}
              externalState={isRunning ? sectionStates.scoring : undefined}
              externalScores={isRunning ? scoresList : undefined}
              onStateChange={(state) => {
                if (!isRunning) {
                  updateSectionState("scoring", state);
                }
              }}
            />
            <OutreachSection
              recommendations={recommendations}
              companyId={initialData.company.id}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── State derivation helpers ─────────────────────────────────────────────────

function deriveResearchState(
  report: ReportData | null,
  reportStatus: string,
): SectionState {
  if (!report) return "empty";
  if (reportStatus === "completed") return "success";
  if (reportStatus === "failed") return "error";
  if (reportStatus === "generating") return "running";
  return "empty";
}

function deriveContactsState(contactList: Contact[]): SectionState {
  return contactList.length > 0 ? "success" : "empty";
}

function deriveScoringState(
  contactList: Contact[],
  scores: LeadScore[],
): SectionState {
  if (scores.length > 0) return "success";
  if (contactList.length > 0) return "empty";
  return "empty";
}

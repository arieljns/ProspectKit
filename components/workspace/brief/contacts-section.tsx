"use client";

import { useState } from "react";
import {
  UsersIcon,
  UserIcon,
  PlayIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  AlertCircleIcon,
  LinkedinIcon,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Skeleton } from "@/components/shared/ui/skeleton";
import { Badge } from "@/components/shared/ui/badge";
import { getBriefData } from "@/lib/actions/briefs";
import type { SectionState } from "./types";
import type { contacts } from "@/lib/db/schema/contacts";

type Contact = typeof contacts.$inferSelect;

type ContactsSectionProps = {
  companyId: string;
  initialContacts: Contact[];
  onComplete?: (success: boolean) => void;
  onStateChange?: (state: SectionState) => void;
  /** When set, overrides the section's internal state (used by BriefRunController during orchestration) */
  externalState?: SectionState;
};

function deriveInitialState(contactList: Contact[]): SectionState {
  if (contactList.length > 0) return "success";
  return "empty";
}

export function ContactsSection({
  companyId,
  initialContacts,
  onComplete,
  onStateChange,
  externalState,
}: ContactsSectionProps) {
  const [internalState, setInternalState] = useState<SectionState>(() =>
    deriveInitialState(initialContacts),
  );
  const [contactsList, setContactsList] = useState<Contact[]>(initialContacts);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use externalState if provided (during orchestration), else internal state
  const state = externalState ?? internalState;

  const updateState = (newState: SectionState) => {
    setInternalState(newState);
    onStateChange?.(newState);
  };

  const handleRun = async () => {
    updateState("running");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/contacts/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        throw new Error("Contact discovery request failed");
      }

      const json = (await response.json()) as { success: boolean };

      if (!json.success) {
        throw new Error("Contact discovery was unsuccessful");
      }

      // Fetch updated brief data to get the new contacts
      const briefResult = await getBriefData(companyId);
      if (briefResult.success) {
        setContactsList(briefResult.data.contacts);
        updateState("success");
        onComplete?.(true);
      } else {
        throw new Error("Failed to retrieve updated contacts");
      }
    } catch {
      updateState("error");
      setErrorMessage(
        "We couldn't find contacts for this company. Please try again.",
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
          <UsersIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Contacts</h2>
          {state === "success" && contactsList.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {contactsList.length}
            </Badge>
          )}
        </div>

        {/* Action button */}
        {state === "empty" && (
          <Button size="sm" onClick={handleRun} disabled={isRunning}>
            <PlayIcon className="h-4 w-4" />
            Find Contacts
          </Button>
        )}
        {state === "running" && (
          <Button size="sm" disabled>
            <RefreshCwIcon className="h-4 w-4 animate-spin" />
            Finding…
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

      {/* Error banner */}
      {state === "error" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {errorMessage ??
              "We couldn't find contacts for this company. Please try again."}
          </p>
        </div>
      )}

      {/* Empty state */}
      {state === "empty" && (
        <p className="text-sm text-muted-foreground">
          No contacts discovered yet. Click &quot;Find Contacts&quot; to
          discover key people at this company.
        </p>
      )}

      {/* Running state (loading skeleton) */}
      {state === "running" && contactsList.length === 0 && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Running with prior data: show faded contacts */}
      {state === "running" && contactsList.length > 0 && (
        <div className="flex flex-col gap-2 opacity-50">
          {contactsList.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}

      {/* Contacts list (success state, and error state with prior data) */}
      {(state === "success" || (state === "error" && contactsList.length > 0)) &&
        contactsList.length > 0 && (
          <div className="flex flex-col gap-2">
            {contactsList.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        )}

      {/* Success state with no contacts found */}
      {state === "success" && contactsList.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No contacts were found for this company.
        </p>
      )}
    </div>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
      {/* Avatar placeholder */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <UserIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Contact info */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{contact.name}</span>
          {contact.linkedinUrl && (
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-blue-600 transition-colors"
              aria-label={`${contact.name} on LinkedIn`}
            >
              <LinkedinIcon className="h-4 w-4" />
            </a>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate">
          {contact.title}
          {contact.department ? ` · ${contact.department}` : ""}
        </span>
      </div>
    </div>
  );
}

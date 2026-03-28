"use client";

import { useState } from "react";
import {
  MessageSquareIcon,
  UserIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  AlertCircleIcon,
  SendIcon,
} from "lucide-react";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import { getGradeBadgeVariant } from "@/lib/utils/scoring";
import type { RecommendedContact } from "@/lib/actions/briefs";

type MessageType = "cold-email" | "linkedin-connection";

type ContactMessageState = {
  status: "idle" | "streaming" | "done" | "error";
  message: string;
  errorMessage: string | null;
  messageType: MessageType;
};

type OutreachSectionProps = {
  recommendations: RecommendedContact[];
};

export function OutreachSection({ recommendations }: OutreachSectionProps) {
  // Per-contact message states
  const [contactStates, setContactStates] = useState<
    Record<string, ContactMessageState>
  >(() => {
    const initial: Record<string, ContactMessageState> = {};
    for (const rec of recommendations) {
      initial[rec.contact.id] = {
        status: "idle",
        message: "",
        errorMessage: null,
        messageType: "cold-email",
      };
    }
    return initial;
  });

  const updateContactState = (
    contactId: string,
    updates: Partial<ContactMessageState>,
  ) => {
    setContactStates((prev) => ({
      ...prev,
      [contactId]: { ...prev[contactId], ...updates },
    }));
  };

  const handleGenerateMessage = async (contactId: string) => {
    const contactState = contactStates[contactId];
    if (!contactState) return;

    updateContactState(contactId, {
      status: "streaming",
      message: "",
      errorMessage: null,
    });

    try {
      const response = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId,
          messageType: contactState.messageType,
        }),
      });

      if (!response.ok) {
        throw new Error("Message generation request failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();
      let fullMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullMessage += chunk;

        // Update incrementally
        updateContactState(contactId, { message: fullMessage });
      }

      updateContactState(contactId, {
        status: "done",
        message: fullMessage,
      });
    } catch {
      updateContactState(contactId, {
        status: "error",
        errorMessage:
          "We couldn't generate the message. Please try again.",
      });
    }
  };

  const handleMessageTypeChange = (contactId: string, value: string) => {
    updateContactState(contactId, {
      messageType: value as MessageType,
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <MessageSquareIcon className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Outreach</h2>
        {recommendations.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {recommendations.length}
          </Badge>
        )}
      </div>

      {/* Empty state: no scored contacts */}
      {recommendations.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No scored contacts yet. Run lead scoring first to see recommended
          contacts for outreach.
        </p>
      )}

      {/* Recommendation cards */}
      {recommendations.length > 0 && (
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => {
            const contactState = contactStates[rec.contact.id];
            if (!contactState) return null;

            return (
              <ContactOutreachCard
                key={rec.contact.id}
                rec={rec}
                contactState={contactState}
                onGenerate={() => handleGenerateMessage(rec.contact.id)}
                onMessageTypeChange={(value) =>
                  handleMessageTypeChange(rec.contact.id, value)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

type ContactOutreachCardProps = {
  rec: RecommendedContact;
  contactState: ContactMessageState;
  onGenerate: () => void;
  onMessageTypeChange: (value: string) => void;
};

function ContactOutreachCard({
  rec,
  contactState,
  onGenerate,
  onMessageTypeChange,
}: ContactOutreachCardProps) {
  const { contact, grade, totalScore } = rec;
  const { status, message, errorMessage, messageType } = contactState;
  const badgeVariant = getGradeBadgeVariant(grade);
  const isStreaming = status === "streaming";

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4">
      {/* Contact header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">
                {contact.name}
              </span>
              <Badge variant={badgeVariant}>{grade}</Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                {totalScore}/100
              </span>
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {contact.title}
              {contact.department ? ` · ${contact.department}` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Message type selector + generate button */}
      {(status === "idle" || status === "error") && (
        <div className="flex items-center gap-2">
          <Select
            value={messageType}
            onValueChange={onMessageTypeChange}
            disabled={isStreaming}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cold-email">Cold Email</SelectItem>
              <SelectItem value="linkedin-connection">
                LinkedIn Connection
              </SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" onClick={onGenerate} disabled={isStreaming}>
            <SendIcon className="h-4 w-4" />
            Generate Message
          </Button>
        </div>
      )}

      {/* Error state */}
      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Streaming indicator */}
      {status === "streaming" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCwIcon className="h-3 w-3 animate-spin" />
          <span>Generating message…</span>
        </div>
      )}

      {/* Message content (streaming or done) */}
      {(status === "streaming" || status === "done") && message && (
        <div className="rounded-md border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
            {message}
          </pre>
        </div>
      )}

      {/* Regenerate button (after completion) */}
      {status === "done" && (
        <div className="flex items-center gap-2">
          <Select
            value={messageType}
            onValueChange={onMessageTypeChange}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cold-email">Cold Email</SelectItem>
              <SelectItem value="linkedin-connection">
                LinkedIn Connection
              </SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" variant="outline" onClick={onGenerate}>
            <RotateCcwIcon className="h-4 w-4" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}

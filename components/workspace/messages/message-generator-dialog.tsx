"use client";

import * as React from "react";
import { Button } from "@/components/shared/ui/button";
import { Checkbox } from "@/components/shared/ui/checkbox";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shared/ui/dialog";
import { Badge } from "@/components/shared/ui/badge";
import { toast } from "sonner";
import { Copy, Sparkles, Send, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  updateContactStatus,
  updateLastContacted,
} from "@/lib/actions/contacts";

type MessageType = "linkedin-connection" | "linkedin-email";

type Contact = {
  id: string;
  name: string;
  title: string;
  companyId: string;
};

type Company = {
  companyName: string;
};

type MessageGeneratorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  company: Company;
};

export function MessageGeneratorDialog({
  open,
  onOpenChange,
  contact,
  company,
}: MessageGeneratorDialogProps) {
  const [messageType, setMessageType] =
    React.useState<MessageType>("linkedin-email");
  const [generatedMessage, setGeneratedMessage] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [markAsContacted, setMarkAsContacted] = React.useState(true);
  const [hasGenerated, setHasGenerated] = React.useState(false);

  const characterLimit = messageType === "linkedin-connection" ? 300 : 2000;
  const characterCount = generatedMessage.length;

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setGeneratedMessage("");
      setFeedback("");
      setHasGenerated(false);
      setMarkAsContacted(true);
    }
  }, [open]);

  const generateMessage = async (isRegenerate: boolean = false) => {
    setIsGenerating(true);
    setGeneratedMessage("");

    try {
      const response = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          messageType,
          feedback: isRegenerate ? feedback : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setGeneratedMessage(accumulatedText);
      }

      setHasGenerated(true);
      if (isRegenerate) {
        setFeedback(""); // Clear feedback after regeneration
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate message",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast.success("Message copied to clipboard");
  };

  const handleClose = async () => {
    // Mark as contacted if checkbox is checked and message was generated
    if (markAsContacted && hasGenerated) {
      await updateContactStatus(contact.id, "contacted");
      await updateLastContacted(contact.id);
      toast.success(`Marked ${contact.name} as contacted`);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Outreach Message</DialogTitle>
          <DialogDescription>
            {contact.name} · {contact.title} @ {company.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Type Selection */}
          <div className="space-y-2">
            <Label>Message Type</Label>
            <div className="flex gap-2">
              <Button
                variant={
                  messageType === "linkedin-connection" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setMessageType("linkedin-connection")}
                disabled={isGenerating}
              >
                LinkedIn Connection Request
              </Button>
              <Button
                variant={
                  messageType === "linkedin-email" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setMessageType("linkedin-email")}
                disabled={isGenerating}
              >
                LinkedIn InMail / Email
              </Button>
            </div>
          </div>

          {/* Generate Button */}
          {!hasGenerated && (
            <Button
              onClick={() => generateMessage(false)}
              disabled={isGenerating}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Message"}
            </Button>
          )}

          {/* Generated Message */}
          {(hasGenerated || isGenerating) && (
            <div className="space-y-2">
              <Label>Generated Message</Label>
              <div className="relative">
                <div
                  className={`min-h-[200px] max-h-[300px] overflow-y-auto rounded-md border p-4 text-sm whitespace-pre-wrap ${
                    isGenerating ? "bg-muted/50" : "bg-background"
                  }`}
                >
                  {generatedMessage || (
                    <span className="text-muted-foreground italic">
                      Generating...
                    </span>
                  )}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                  )}
                </div>
              </div>

              {/* Character Count & Feedback Buttons */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={
                      characterCount > characterLimit
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    Character count: {characterCount} / {characterLimit}
                  </span>
                  {characterCount > characterLimit && (
                    <Badge variant="destructive" className="text-xs">
                      Over limit
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => toast.success("Thanks for your feedback!")}
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground hover:text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => toast.success("Thanks for your feedback!")}
                  >
                    <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground hover:text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Regenerate */}
          {hasGenerated && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="feedback">
                Feedback (optional - for regeneration)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="feedback"
                  placeholder="e.g., Make it shorter, more casual, focus on X..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isGenerating}
                />
                <Button
                  onClick={() => generateMessage(true)}
                  disabled={isGenerating || !feedback.trim()}
                  variant="secondary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {hasGenerated && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mark-contacted"
                  checked={markAsContacted}
                  onCheckedChange={(checked) =>
                    setMarkAsContacted(checked as boolean)
                  }
                />
                <label
                  htmlFor="mark-contacted"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Mark contact as &quot;Contacted&quot;
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  disabled={!generatedMessage || isGenerating}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={handleClose} size="sm">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

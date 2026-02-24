"use client";

import * as React from "react";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Textarea } from "@/components/shared/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/ui/select";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { createCompany } from "@/lib/actions/companies";

const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

type AddCompanyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AddCompanyDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCompanyDialogProps) {
  const [companyName, setCompanyName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [size, setSize] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isAutoFilling, setIsAutoFilling] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setCompanyName("");
      setIndustry("");
      setSize("");
      setWebsite("");
      setDescription("");
    }
  }, [open]);

  const handleAutoFill = async () => {
    if (!companyName.trim()) {
      toast.error("Please enter a company name first");
      return;
    }

    setIsAutoFilling(true);

    try {
      const response = await fetch("/api/companies/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const {
          industry: autoIndustry,
          size: autoSize,
          website: autoWebsite,
          description: autoDescription,
        } = result.data;

        if (autoIndustry) setIndustry(autoIndustry);
        if (autoSize) setSize(autoSize);
        if (autoWebsite) setWebsite(autoWebsite);
        if (autoDescription) setDescription(autoDescription);

        toast.success("Auto-filled company information");
      } else {
        toast.error(result.error || "Failed to auto-fill");
      }
    } catch (error) {
      console.error("Auto-fill error:", error);
      toast.error("Failed to auto-fill company information");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createCompany({
        companyName: companyName.trim(),
        industry: industry.trim() || null,
        size: size || null,
        website: website.trim() || null,
        description: description.trim() || null,
        priority: "Low",
        reportStatus: "none",
      });

      if (result.success) {
        toast.success(`Added ${companyName}`);
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || "Failed to add company");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to add company");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>
            Enter company information. Only company name is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company-name"
              placeholder="e.g., Stripe"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>

          {/* Auto-fill Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleAutoFill}
            disabled={!companyName.trim() || isAutoFilling || isSaving}
          >
            {isAutoFilling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Auto-filling...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-fill with AI
              </>
            )}
          </Button>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g., FinTech, SaaS, AI/ML"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <Label htmlFor="size">Company Size</Label>
            <Select
              value={size}
              onValueChange={setSize}
              disabled={isAutoFilling || isSaving}
            >
              <SelectTrigger id="size">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((sizeOption) => (
                  <SelectItem key={sizeOption} value={sizeOption}>
                    {sizeOption} employees
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what the company does..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!companyName.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Company"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

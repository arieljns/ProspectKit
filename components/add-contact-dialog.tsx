"use client";

import * as React from "react";
import { Button } from "@/components/shadcnui/button";
import { Input } from "@/components/shadcnui/input";
import { Label } from "@/components/shadcnui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcnui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcnui/select";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { createContact } from "@/lib/actions/contacts";
import { getAllCompanies } from "@/lib/actions/companies";

type Company = {
  id: string;
  companyName: string;
};

type AddContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function AddContactDialog({ open, onOpenChange, onSuccess }: AddContactDialogProps) {
  const [linkedinUrl, setLinkedinUrl] = React.useState("");
  const [companyId, setCompanyId] = React.useState("");
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [isAutoFilling, setIsAutoFilling] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(false);

  // Load companies when dialog opens
  React.useEffect(() => {
    if (open) {
      loadCompanies();
    } else {
      // Reset form when dialog closes
      setLinkedinUrl("");
      setCompanyId("");
      setName("");
      setTitle("");
      setDepartment("");
    }
  }, [open]);

  const loadCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const result = await getAllCompanies();
      if (result.success && result.data) {
        setCompanies(result.data as Company[]);
      }
    } catch (error) {
      console.error("Failed to load companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleAutoFill = async () => {
    if (!linkedinUrl.trim()) {
      toast.error("Please enter a LinkedIn URL first");
      return;
    }

    setIsAutoFilling(true);

    try {
      const response = await fetch("/api/contacts/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { name: autoName, title: autoTitle, department: autoDepartment, companyName } = result.data;

        if (autoName) setName(autoName);
        if (autoTitle) setTitle(autoTitle);
        if (autoDepartment) setDepartment(autoDepartment);

        // Try to match company name with existing companies
        if (companyName) {
          const matchedCompany = companies.find((c) => c.companyName.toLowerCase() === companyName.toLowerCase());
          if (matchedCompany) {
            setCompanyId(matchedCompany.id);
            toast.success(`Auto-filled and matched company: ${matchedCompany.companyName}`);
          } else {
            toast.success(`Auto-filled contact info. Company "${companyName}" not found - please select manually.`);
          }
        } else {
          toast.success("Auto-filled contact information");
        }
      } else {
        toast.error(result.error || "Failed to auto-fill");
      }
    } catch (error) {
      console.error("Auto-fill error:", error);
      toast.error("Failed to auto-fill contact information");
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!linkedinUrl.trim()) {
      toast.error("LinkedIn URL is required");
      return;
    }
    if (!companyId) {
      toast.error("Please select a company");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createContact({
        companyId,
        name: name.trim(),
        title: title.trim(),
        department: department.trim() || null,
        linkedinUrl: linkedinUrl.trim(),
        contactStatus: "new",
        priority: "Low",
        lastContactedAt: null,
        notes: null,
      });

      if (result.success) {
        toast.success(`Added ${name}`);
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || "Failed to add lead");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to add lead");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>Enter LinkedIn URL and let Grok extract the contact information.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* LinkedIn URL */}
          <div className="space-y-2">
            <Label htmlFor="linkedin-url">
              LinkedIn URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>

          {/* Auto-fill Button */}
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleAutoFill}
            disabled={!linkedinUrl.trim() || isAutoFilling || isSaving}
          >
            {isAutoFilling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting from LinkedIn...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-fill with Grok
              </>
            )}
          </Button>

          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company">
              Company <span className="text-destructive">*</span>
            </Label>
            <Select
              value={companyId}
              onValueChange={setCompanyId}
              disabled={isAutoFilling || isSaving || isLoadingCompanies}
            >
              <SelectTrigger id="company">
                <SelectValue placeholder={isLoadingCompanies ? "Loading companies..." : "Select a company"} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.companyName}
                  </SelectItem>
                ))}
                {companies.length === 0 && !isLoadingCompanies && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No companies found. Add a company first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., VP of Engineering"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="e.g., Engineering, Sales"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={isAutoFilling || isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!linkedinUrl.trim() || !companyId || !name.trim() || !title.trim() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Contact"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { SiteHeader } from "@/components/workspace/layout/site-header";
import { Button } from "@/components/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Textarea } from "@/components/shared/ui/textarea";
import { Checkbox } from "@/components/shared/ui/checkbox";
import { Slider } from "@/components/shared/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shared/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { toast } from "sonner";
import {
  getScoringConfig,
  updateScoringConfig,
  resetScoringConfig,
} from "@/lib/actions/scoring-config";
import { validateWeights } from "@/lib/utils/scoring";

// Available industries
const AVAILABLE_INDUSTRIES = [
  "SaaS",
  "FinTech",
  "AI/ML",
  "Developer Tools",
  "Healthcare",
  "E-commerce",
  "Enterprise Software",
  "Data & Analytics",
];

// Available seniority levels
const SENIORITY_LEVELS = ["C-level", "VP", "Director", "Manager", "Individual"];

export default function ScoringConfigPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [companyName, setCompanyName] = React.useState("");
  const [companyDescription, setCompanyDescription] = React.useState("");
  const [productDescription, setProductDescription] = React.useState("");
  const [targetIndustries, setTargetIndustries] = React.useState<string[]>([]);
  const [targetSeniorityLevels, setTargetSeniorityLevels] = React.useState<
    string[]
  >([]);
  const [weights, setWeights] = React.useState({
    industryMatch: 25,
    companyMatch: 30,
    positionMatch: 20,
    seniorityMatch: 15,
    dealSizeMatch: 10,
  });

  const loadConfig = React.useCallback(async () => {
    setIsLoading(true);
    const result = await getScoringConfig();

    if (result.success && result.data) {
      const config = result.data;
      setCompanyName(config.userCompanyName);
      setCompanyDescription(config.userCompanyDescription);
      setProductDescription(config.productDescription);
      setTargetIndustries(config.targetIndustries as string[]);
      setTargetSeniorityLevels(config.targetSeniorityLevels as string[]);
      setWeights(
        config.weights as {
          industryMatch: number;
          companyMatch: number;
          positionMatch: number;
          seniorityMatch: number;
          dealSizeMatch: number;
        },
      );
    }

    setIsLoading(false);
  }, []);

  // Load config on mount
  React.useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    // Validate weights
    const { valid, total } = validateWeights(weights);
    if (!valid) {
      toast.error(`Weights must sum to 100%. Current sum: ${total}%`);
      return;
    }

    // Validate required fields
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!companyDescription.trim()) {
      toast.error("Company description is required");
      return;
    }
    if (!productDescription.trim()) {
      toast.error("Product description is required");
      return;
    }
    if (targetIndustries.length === 0) {
      toast.error("Please select at least one target industry");
      return;
    }
    if (targetSeniorityLevels.length === 0) {
      toast.error("Please select at least one target seniority level");
      return;
    }

    setIsSaving(true);

    const result = await updateScoringConfig({
      userCompanyName: companyName,
      userCompanyDescription: companyDescription,
      productDescription: productDescription,
      targetIndustries,
      targetSeniorityLevels,
      weights,
    });

    setIsSaving(false);

    if (result.success) {
      toast.success("Configuration saved successfully!");
    } else {
      toast.error(result.error || "Failed to save configuration");
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset to default configuration?")) {
      return;
    }

    const result = await resetScoringConfig();

    if (result.success) {
      toast.success("Configuration reset to defaults");
      loadConfig(); // Reload to show defaults
    } else {
      toast.error(result.error || "Failed to reset configuration");
    }
  };

  const handleIndustryToggle = (industry: string) => {
    setTargetIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry],
    );
  };

  const handleSeniorityToggle = (level: string) => {
    setTargetSeniorityLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const handleWeightChange = (dimension: string, value: number[]) => {
    setWeights((prev) => ({
      ...prev,
      [dimension]: value[0],
    }));
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isWeightValid = totalWeight === 100;

  if (isLoading) {
    return (
      <>
        <SiteHeader title="Customization" />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-muted-foreground">Loading configuration...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <SiteHeader title="Customization" />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <p className="text-base text-muted-foreground">
              Configure your company profile and lead scoring criteria
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isWeightValid || isSaving}
              >
                {isSaving ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </div>

          {/* Main Content - Left/Right Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* LEFT: Company & Product Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Company & Product</CardTitle>
                  <CardDescription>
                    Tell us about your company and what you are selling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., OpenAI"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyDescription">
                      Company Description
                    </Label>
                    <Textarea
                      id="companyDescription"
                      placeholder="Briefly describe your company and what it does..."
                      rows={5}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productDescription">
                      Product/Service Description
                    </Label>
                    <Textarea
                      id="productDescription"
                      placeholder="Describe the product or service you're selling..."
                      rows={8}
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Lead Scoring Criteria */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Scoring Criteria</CardTitle>
                  <CardDescription>
                    Define your ideal customer profile and scoring weights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Target Industries */}
                  <div className="space-y-3">
                    <Label>Target Industries</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {AVAILABLE_INDUSTRIES.map((industry) => (
                        <div
                          key={industry}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`industry-${industry}`}
                            checked={targetIndustries.includes(industry)}
                            onCheckedChange={() =>
                              handleIndustryToggle(industry)
                            }
                          />
                          <label
                            htmlFor={`industry-${industry}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {industry}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Target Seniority Levels */}
                  <div className="space-y-3">
                    <Label>Target Seniority Levels</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {SENIORITY_LEVELS.map((level) => (
                        <div
                          key={level}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`seniority-${level}`}
                            checked={targetSeniorityLevels.includes(level)}
                            onCheckedChange={() => handleSeniorityToggle(level)}
                          />
                          <label
                            htmlFor={`seniority-${level}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {level}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dimension Weights */}
                  <div className="space-y-4 border-t pt-6">
                    <div className="flex items-center justify-between">
                      <Label>Dimension Weights</Label>
                      <div
                        className={`text-sm font-medium ${isWeightValid ? "text-green-600" : "text-destructive"}`}
                      >
                        Total: {totalWeight}% {isWeightValid ? "✓" : "✗"}
                      </div>
                    </div>

                    {/* Industry Match */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="weight-industry" className="text-sm">
                            Industry Match
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                Does the lead&apos;s company operate in your
                                target industries? Higher score means better
                                industry alignment with your product.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {weights.industryMatch}%
                        </span>
                      </div>
                      <Slider
                        id="weight-industry"
                        min={0}
                        max={100}
                        step={5}
                        value={[weights.industryMatch]}
                        onValueChange={(value) =>
                          handleWeightChange("industryMatch", value)
                        }
                      />
                    </div>

                    {/* Company Match */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="weight-company" className="text-sm">
                            Company Need Match
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                Based on the company&apos;s business and
                                challenges, how likely do they need your
                                product? AI evaluates company fit and pain
                                points that your solution addresses.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {weights.companyMatch}%
                        </span>
                      </div>
                      <Slider
                        id="weight-company"
                        min={0}
                        max={100}
                        step={5}
                        value={[weights.companyMatch]}
                        onValueChange={(value) =>
                          handleWeightChange("companyMatch", value)
                        }
                      />
                    </div>

                    {/* Position Match */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="weight-position" className="text-sm">
                            Position Match
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                Is this person a decision maker or potential
                                user of your product? Considers job function,
                                department, and influence level in buying
                                decisions.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {weights.positionMatch}%
                        </span>
                      </div>
                      <Slider
                        id="weight-position"
                        min={0}
                        max={100}
                        step={5}
                        value={[weights.positionMatch]}
                        onValueChange={(value) =>
                          handleWeightChange("positionMatch", value)
                        }
                      />
                    </div>

                    {/* Seniority Match */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="weight-seniority" className="text-sm">
                            Seniority Match
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                Does the lead&apos;s seniority level match your
                                target levels (C-level, VP, Director, etc.)?
                                Higher seniority often means faster
                                decision-making authority.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {weights.seniorityMatch}%
                        </span>
                      </div>
                      <Slider
                        id="weight-seniority"
                        min={0}
                        max={100}
                        step={5}
                        value={[weights.seniorityMatch]}
                        onValueChange={(value) =>
                          handleWeightChange("seniorityMatch", value)
                        }
                      />
                    </div>

                    {/* Deal Size */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="weight-dealsize" className="text-sm">
                            Deal Size Potential
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                Combines company size with product need to
                                estimate revenue potential. Larger companies
                                with higher need = bigger deal opportunities.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-sm font-medium">
                          {weights.dealSizeMatch}%
                        </span>
                      </div>
                      <Slider
                        id="weight-dealsize"
                        min={0}
                        max={100}
                        step={5}
                        value={[weights.dealSizeMatch]}
                        onValueChange={(value) =>
                          handleWeightChange("dealSizeMatch", value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

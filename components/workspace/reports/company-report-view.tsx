"use client";

import { Badge } from "@/components/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";
import { Separator } from "@/components/shared/ui/separator";
import { ReportData } from "@/lib/db/schema/company-reports";
import {
  BuildingIcon,
  TrendingUpIcon,
  UsersIcon,
  BarChartIcon,
  PackageIcon,
  LightbulbIcon,
  NewspaperIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
  TargetIcon,
} from "lucide-react";

export function CompanyReportView({ report }: { report: ReportData }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {report.companyName}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {report.industry && (
                <Badge variant="secondary" className="gap-1.5">
                  <BuildingIcon className="h-3.5 w-3.5" />
                  {report.industry}
                </Badge>
              )}
              {report.size && (
                <Badge variant="secondary" className="gap-1.5">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {report.size} employees
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Overview
            </h4>
            <p className="text-sm leading-relaxed">{report.summary.overview}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
                Key Strengths
              </h4>
              <ul className="space-y-1.5">
                {report.summary.keyStrengths.map((strength, idx) => (
                  <li key={idx} className="text-sm flex gap-2">
                    <span className="text-green-500 shrink-0">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
                Challenges
              </h4>
              <ul className="space-y-1.5">
                {report.summary.challenges.map((challenge, idx) => (
                  <li key={idx} className="text-sm flex gap-2">
                    <span className="text-orange-500 shrink-0">•</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <TargetIcon className="h-4 w-4" />
              Market Position
            </h4>
            <p className="text-sm leading-relaxed">
              {report.summary.marketPosition}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Financials (if available) */}
      {report.financials && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {report.financials.revenue && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Revenue
                  </div>
                  <div className="text-sm font-medium">
                    {report.financials.revenue}
                  </div>
                </div>
              )}
              {report.financials.funding && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Funding
                  </div>
                  <div className="text-sm font-medium">
                    {report.financials.funding}
                  </div>
                </div>
              )}
              {report.financials.valuation && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Valuation
                  </div>
                  <div className="text-sm font-medium">
                    {report.financials.valuation}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products & Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Products & Services
          </CardTitle>
          <CardDescription>Key offerings and solutions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {report.products.map((product, idx) => (
              <div
                key={idx}
                className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold">{product.name}</h4>
                  <Badge variant="outline" className="shrink-0">
                    {product.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TargetIcon className="h-5 w-5" />
            Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Target Market
            </h4>
            <p className="text-sm">{report.marketAnalysis.targetMarket}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Market Size
            </h4>
            <p className="text-sm">{report.marketAnalysis.marketSize}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Key Competitors
            </h4>
            <div className="flex flex-wrap gap-2">
              {report.marketAnalysis.competitors.map((competitor, idx) => (
                <Badge key={idx} variant="outline">
                  {competitor}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LightbulbIcon className="h-5 w-5" />
            Business Opportunities
          </CardTitle>
          <CardDescription>Identified opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {report.insights.opportunities.map((opportunity, idx) => (
              <li key={idx} className="text-sm flex gap-2">
                <span className="text-yellow-500 shrink-0 mt-0.5">💡</span>
                <span>{opportunity}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recent News */}
      {report.recentNews && report.recentNews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NewspaperIcon className="h-5 w-5" />
              Recent News
            </CardTitle>
            <CardDescription>Latest updates and announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.recentNews.map((news, idx) => (
                <a
                  key={idx}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {news.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {news.url}
                    </div>
                  </div>
                  <ExternalLinkIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import { ArrowRightIcon } from "lucide-react";

type LeadStatusFunnelProps = {
  data: {
    new: number;
    contacted: number;
    responded: number;
    qualified: number;
    not_interested: number;
  };
};

export function LeadStatusFunnel({ data }: LeadStatusFunnelProps) {
  const total =
    data.new +
    data.contacted +
    data.responded +
    data.qualified +
    data.not_interested;

  // Funnel stages should show cumulative counts (leads that reached this stage)
  const contactedCount = data.contacted + data.responded + data.qualified;
  const respondedCount = data.responded + data.qualified;
  const qualifiedCount = data.qualified;

  const stages = [
    {
      label: "Total Leads",
      count: total,
      percentage: 100,
      color: "bg-gray-400",
    },
    {
      label: "Contacted",
      count: contactedCount,
      percentage: total > 0 ? (contactedCount / total) * 100 : 0,
      color: "bg-blue-500",
    },
    {
      label: "Responded",
      count: respondedCount,
      percentage: total > 0 ? (respondedCount / total) * 100 : 0,
      color: "bg-purple-500",
    },
    {
      label: "Qualified",
      count: qualifiedCount,
      percentage: total > 0 ? (qualifiedCount / total) * 100 : 0,
      color: "bg-green-500",
    },
  ];

  // Calculate conversion rates between stages
  const contactedRate = total > 0 ? (contactedCount / total) * 100 : 0;
  const respondedRate =
    contactedCount > 0 ? (respondedCount / contactedCount) * 100 : 0;
  const qualifiedRate =
    respondedCount > 0 ? (qualifiedCount / respondedCount) * 100 : 0;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Lead Status Funnel</CardTitle>
        <CardDescription>
          Conversion pipeline from new leads to qualified
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label}>
              {/* Stage Row */}
              <div className="flex items-center gap-3">
                {/* Label */}
                <div className="w-24 text-sm font-medium">{stage.label}</div>

                {/* Bar */}
                <div className="flex-1 relative h-12 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`${stage.color} h-full transition-all duration-300 flex items-center justify-between px-4 text-white font-semibold`}
                    style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                  >
                    <span className="text-sm">{stage.count}</span>
                    <span className="text-xs opacity-90">
                      {stage.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Conversion Rate Arrow (skip for last stage) */}
              {index < stages.length - 1 && (
                <div className="flex items-center gap-2 ml-24 mt-1 mb-2 text-xs text-muted-foreground">
                  <ArrowRightIcon className="h-3 w-3" />
                  <span>
                    {index === 0 &&
                      `${contactedRate.toFixed(1)}% reached contacted`}
                    {index === 1 &&
                      `${respondedRate.toFixed(1)}% reached responded`}
                    {index === 2 &&
                      `${qualifiedRate.toFixed(1)}% reached qualified`}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Not Interested (separate) */}
          {data.not_interested > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-muted-foreground">
                  Not Interested
                </div>
                <div className="flex-1 relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="bg-red-400 h-full transition-all duration-300 flex items-center justify-between px-4 text-white text-sm font-semibold"
                    style={{
                      width: `${Math.max((data.not_interested / total) * 100, 5)}%`,
                    }}
                  >
                    <span>{data.not_interested}</span>
                    <span className="text-xs opacity-90">
                      {((data.not_interested / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

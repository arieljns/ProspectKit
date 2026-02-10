"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcnui/card";
import { Badge } from "@/components/shadcnui/badge";

type ScoreDistributionChartProps = {
  data: {
    aGrade: number;
    bGrade: number;
    cGrade: number;
    notScored: number;
  };
};

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const total = data.aGrade + data.bGrade + data.cGrade + data.notScored;

  const distribution = [
    {
      label: "A",
      description: "85+ score",
      count: data.aGrade,
      percentage: total > 0 ? (data.aGrade / total) * 100 : 0,
      color: "bg-green-500",
      badgeClass: "bg-green-500 text-white hover:bg-green-600",
    },
    {
      label: "B",
      description: "70-84 score",
      count: data.bGrade,
      percentage: total > 0 ? (data.bGrade / total) * 100 : 0,
      color: "bg-yellow-500",
      badgeClass: "bg-yellow-500 text-white hover:bg-yellow-600",
    },
    {
      label: "C",
      description: "Below 70",
      count: data.cGrade,
      percentage: total > 0 ? (data.cGrade / total) * 100 : 0,
      color: "bg-orange-500",
      badgeClass: "bg-orange-500 text-white hover:bg-orange-600",
    },
    {
      label: "Not Scored",
      description: "No score yet",
      count: data.notScored,
      percentage: total > 0 ? (data.notScored / total) * 100 : 0,
      color: "bg-gray-400",
      badgeClass: "bg-gray-400 text-white hover:bg-gray-500",
    },
  ];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Score Distribution</CardTitle>
        <CardDescription>Lead quality breakdown by grade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {distribution.map((item) => (
            <div key={item.label} className="space-y-2">
              {/* Label and Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`${item.badgeClass} min-w-12 justify-center`}>
                    {item.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{item.count}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`${item.color} h-full transition-all duration-300`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Total Leads</span>
              <span className="font-bold tabular-nums">{total}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Scored Leads</span>
              <span className="tabular-nums">{data.aGrade + data.bGrade + data.cGrade}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

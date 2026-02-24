import {
  TrendingDownIcon,
  TrendingUpIcon,
  SparklesIcon,
  UsersIcon,
  TargetIcon,
  CheckCircle2Icon,
} from "lucide-react";

import { Badge } from "@/components/shared/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";

type SectionCardsProps = {
  data: {
    totalLeads: number;
    aGradeCount: number;
    aGradeRate: number;
    contactedRate: number;
    qualifiedRate: number;
  };
};

export function SectionCards({ data }: SectionCardsProps) {
  return (
    <div className="data-[slot=card]:*:shadow-2xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 data-[slot=card]:*:bg-linear-to-t data-[slot=card]:*:from-primary/5 data-[slot=card]:*:to-card dark:data-[slot=card]:*:bg-card lg:px-6">
      {/* Total Leads */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Total Leads</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.totalLeads}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <UsersIcon className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All leads in pipeline
          </div>
          <div className="text-muted-foreground">
            Total contacts across all statuses
          </div>
        </CardFooter>
      </Card>

      {/* High Quality Leads (A-Grade) */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>High Quality Leads</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.aGradeCount}
          </CardTitle>
          <div className="absolute right-4 top-4">
            <Badge
              variant="outline"
              className="flex gap-1 rounded-lg text-xs bg-green-50 text-green-700 border-green-200"
            >
              <SparklesIcon className="size-3" />
              {data.aGradeRate.toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
            A-grade leads (85+ score)
          </div>
          <div className="text-muted-foreground">
            Highest potential prospects
          </div>
        </CardFooter>
      </Card>

      {/* Contacted Rate */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Contacted Rate</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.contactedRate.toFixed(1)}%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <TargetIcon className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Outreach coverage
          </div>
          <div className="text-muted-foreground">
            Leads that have been contacted
          </div>
        </CardFooter>
      </Card>

      {/* Qualified Rate */}
      <Card className="@container/card">
        <CardHeader className="relative">
          <CardDescription>Qualified Rate</CardDescription>
          <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
            {data.qualifiedRate.toFixed(1)}%
          </CardTitle>
          <div className="absolute right-4 top-4">
            <CheckCircle2Icon className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Qualification success
          </div>
          <div className="text-muted-foreground">Leads marked as qualified</div>
        </CardFooter>
      </Card>
    </div>
  );
}

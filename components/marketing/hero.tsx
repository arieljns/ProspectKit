import Link from "next/link";

import { Badge } from "@/components/shadcnui/badge";
import { Button } from "@/components/shadcnui/button";
import { PROSPECTKIT_REPO_URL } from "@/lib/marketing/links";

export function Hero() {
  return (
    <section className="border-b">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <Badge variant="secondary">Open-source • Clay/Apollo-lite</Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Lead gen and outreach—without the bloat.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            ProspectKit is an open-source outbound workspace built for small teams and early-stage startups.
            Research companies, find decision-makers, score leads, and draft outreach in one place.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/app">Try the demo</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={PROSPECTKIT_REPO_URL} target="_blank" rel="noreferrer">
                View source
              </a>
            </Button>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Self-host for free. Sponsor to support development. Contact us for help or partnerships.
          </p>
        </div>

        <div className="rounded-xl border bg-linear-to-b from-muted/50 to-background p-6">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Pipeline snapshot</div>
              <span className="text-xs text-muted-foreground">Example</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "New", value: "42" },
                { label: "Contacted", value: "18" },
                { label: "Qualified", value: "6" },
              ].map((item) => (
                <div key={item.label} className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-lg font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full rounded bg-muted" />
              <div className="h-2 w-11/12 rounded bg-muted" />
              <div className="h-2 w-9/12 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

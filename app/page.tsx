import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/shadcnui/button";
import { Badge } from "@/components/shadcnui/badge";

export const metadata: Metadata = {
  title: "Orbit SDR",
  description:
    "A lightweight, open-source SDR for small teams—focused on lead generation and outreach.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <Badge variant="secondary" className="mb-6">
          Open-source • Clay/Apollo-lite
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Orbit SDR
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          A lightweight SDR app for small teams and early-stage startups—focused
          on core lead generation, research, and outreach workflows.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/app">Try the demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a
              href="https://github.com/zebangeth/OrbitSDR_Vercel"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-5">
            <h2 className="text-sm font-medium">Lead generation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover target companies, find decision-makers, and keep leads
              organized from first touch to qualification.
            </p>
          </div>
          <div className="rounded-lg border p-5">
            <h2 className="text-sm font-medium">Outreach</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate tailored messages and track pipeline metrics so your team
              can move faster with fewer tools.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

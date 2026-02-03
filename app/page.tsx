import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Orbit SDR — Lightweight SDR for Small Teams",
  description:
    "An open-source Clay/Apollo-lite SDR focused on lead generation, research, and outreach for small teams and early-stage startups.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <MarketingFooter />
    </div>
  );
}

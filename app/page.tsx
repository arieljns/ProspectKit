import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/template/marketing-nav";
import { DivideX } from "@/components/marketing/template/divide";
import { Hero } from "@/components/marketing/template/hero";
import { HeroImage } from "@/components/marketing/template/hero-image";
import { LogoCloud } from "@/components/marketing/template/logo-cloud";
import { HowItWorks } from "@/components/marketing/template/how-it-works";
import { AgenticIntelligence } from "@/components/marketing/template/agentic-intelligence";
import { UseCases } from "@/components/marketing/template/use-cases";
import { Benefits } from "@/components/marketing/template/benefits";
import { Testimonials } from "@/components/marketing/template/testimonials";
import { Pricing } from "@/components/marketing/template/pricing";
import { Security } from "@/components/marketing/template/security";
import { FAQ } from "@/components/marketing/template/faq";
import { CTA } from "@/components/marketing/template/cta";
import { Footer } from "@/components/marketing/template/footer";

export const metadata: Metadata = {
  title: "Orbit SDR — Lean Outbound Workspace",
  description:
    "Open-source SDR app for small startup teams focused on essential lead-generation and outreach.",
};

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-white antialiased dark:bg-black">
      <MarketingNav />
      <DivideX />
      <Hero />
      <DivideX />
      <HeroImage />
      <DivideX />
      <LogoCloud />
      <DivideX />
      <HowItWorks />
      <DivideX />
      <AgenticIntelligence />
      <DivideX />
      <UseCases />
      <DivideX />
      <Benefits />
      <DivideX />
      <Testimonials />
      <DivideX />
      <Pricing />
      <DivideX />
      <Security />
      <DivideX />
      <FAQ />
      <DivideX />
      <CTA />
      <DivideX />
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { DivideX } from "@/components/marketing/divide";
import { Hero } from "@/components/marketing/hero";
import { HeroImage } from "@/components/marketing/hero-image";
import { LogoCloud } from "@/components/marketing/logo-cloud";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AgenticIntelligence } from "@/components/marketing/agentic-intelligence";
import { Benefits } from "@/components/marketing/benefits";
import { Testimonials } from "@/components/marketing/testimonials";
import { Security } from "@/components/marketing/security";
import { FAQ } from "@/components/marketing/faq";
import { CTA } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "ProspectKit — Essential SDR Workflow for Tiny Teams",
  description: "Complete the essential SDR loop with a tiny team.",
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
      <Benefits />
      <DivideX />
      <Testimonials />
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

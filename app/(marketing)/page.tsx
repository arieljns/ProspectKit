import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/template/marketing-nav";
import { DivideX } from "@/components/marketing/template/divide";
import { Hero } from "@/components/marketing/template/hero";
import { HeroImage } from "@/components/marketing/template/hero-image";
import { LogoCloud } from "@/components/marketing/template/logo-cloud";
import { HowItWorks } from "@/components/marketing/template/how-it-works";
import { AgenticIntelligence } from "@/components/marketing/template/agentic-intelligence";
import { Benefits } from "@/components/marketing/template/benefits";
import { Testimonials } from "@/components/marketing/template/testimonials";
import { Security } from "@/components/marketing/template/security";
import { FAQ } from "@/components/marketing/template/faq";
import { CTA } from "@/components/marketing/template/cta";
import { Footer } from "@/components/marketing/template/footer";

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

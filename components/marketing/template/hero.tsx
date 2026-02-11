"use client";
import React from "react";
import { Container } from "./container";
import { Heading } from "./heading";
import { SubHeading } from "./subheading";
import { motion } from "motion/react";
import { Button } from "./button";
import { Badge } from "./badge";
import Link from "next/link";
import { landingLinks } from "@/lib/marketing/landing-content";
import { PROSPECTKIT_REPO_URL } from "@/lib/marketing/links";

export const Hero = () => {
  return (
    <Container
      id="hero"
      className="border-divide flex flex-col items-center justify-center border-x px-4 pt-10 pb-10 md:pt-32 md:pb-20"
    >
      <Badge text="Open-source • Built for teams under 5" />
      <Heading className="mt-4">
        Complete the essential SDR loop <br />
        with a <span className="text-brand">tiny team</span>
      </Heading>

      <SubHeading className="mx-auto mt-6 max-w-lg">
        ProspectKit is a lightweight alternative to heavier outbound suites:
        discover accounts, research contacts, score leads, draft outreach, and
        monitor pipeline signal in one focused workspace.
      </SubHeading>

      <div className="mt-6 flex items-center gap-4">
        <Button as={Link} href={landingLinks.primaryCta}>
          Try the demo
        </Button>
        <Button variant="secondary" as="a" href={PROSPECTKIT_REPO_URL} target="_blank" rel="noreferrer">
          View source
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-gray-600 sm:text-sm dark:text-neutral-300">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          Built for startups moving from founder-led sales to repeatable outbound.
        </motion.span>
      </div>
    </Container>
  );
};

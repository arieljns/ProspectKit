"use client";

import React from "react";
import { Container } from "../container";
import { Badge } from "../badge";
import { SubHeading } from "../subheading";
import { SectionHeading } from "../section-heading";
import { howItWorksSteps } from "@/lib/marketing/landing-content";

export const HowItWorks = () => {
  return (
    <Container
      id="how-it-works"
      className="border-divide border-x px-4 md:px-8"
    >
      <div className="flex flex-col items-center py-16">
        <Badge text="Workflow map" />
        <SectionHeading className="mt-4">
          Complete the essential SDR loop with a tiny team
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-2xl">
          ProspectKit covers the six key outreach stages from account discovery
          to pipeline visibility, without CRM or sequence-tool complexity.
        </SubHeading>

        <div className="border-divide mt-14 grid w-full grid-cols-1 border-t border-b md:grid-cols-2 lg:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <article
              key={step.title}
              className="border-divide flex min-h-44 flex-col border-b p-6 md:border-r md:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r lg:[&:nth-child(3n)]:border-r-0"
            >
              <p className="text-brand text-xs font-mono uppercase tracking-wide">
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="text-charcoal-700 mt-3 text-lg font-medium dark:text-neutral-100">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Container>
  );
};

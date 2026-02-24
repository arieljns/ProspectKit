"use client";

import React from "react";
import { motion } from "motion/react";
import { Container } from "./container";
import { Badge } from "./badge";
import { SectionHeading } from "./section-heading";
import { SubHeading } from "./subheading";
import { workflowOutcomes } from "@/lib/marketing/landing-content";

export const Testimonials = () => {
  return (
    <Container
      id="outcomes"
      className="border-divide border-x px-4 py-16 md:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <Badge text="Workflow outcomes" />
        <SectionHeading className="mt-4">
          What this workflow optimizes for
        </SectionHeading>
        <SubHeading as="p" className="mx-auto mt-6 max-w-2xl">
          ProspectKit is built to improve execution quality across the full
          outbound loop, not just one isolated step.
        </SubHeading>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        {workflowOutcomes.map((item, index) => (
          <motion.article
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="border-divide rounded-lg border bg-gray-50 p-6 dark:bg-neutral-800"
          >
            <p className="text-brand text-sm font-mono uppercase tracking-wide">
              {item.metric}
            </p>
            <h3 className="text-charcoal-700 mt-2 text-lg font-medium dark:text-neutral-100">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
              {item.description}
            </p>
          </motion.article>
        ))}
      </div>
    </Container>
  );
};

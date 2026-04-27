"use client";
import React from "react";
import { Container } from "./container";
import { Badge } from "./badge";
import { SectionHeading } from "./section-heading";
import { SubHeading } from "./subheading";
import {
  RocketIcon,
  GraphIcon,
  ShieldIcon,
  ReuseBrainIcon,
  ScreenCogIcon,
} from "@/icons/card-icons";
import { motion } from "motion/react";
import { RealtimeSyncIcon } from "@/icons/bento-icons";
import { LogoSVG } from "./logo";
import { landingBenefitCards } from "@/lib/marketing/landing-content";

const benefitIcons = [
  <RocketIcon className="text-brand size-6" key="rocket" />,
  <RealtimeSyncIcon className="text-brand size-6" key="sync" />,
  <GraphIcon className="text-brand size-6" key="graph" />,
  <ReuseBrainIcon className="text-brand size-6" key="brain" />,
  <ShieldIcon className="text-brand size-6" key="shield" />,
  <ScreenCogIcon className="text-brand size-6" key="screen" />,
];

export const Benefits = () => {
  return (
    <Container
      id="benefits"
      className="border-divide relative overflow-hidden border-x px-4 py-20 md:px-8"
    >
      <div className="relative flex flex-col items-center">
        <Badge text="Why this shape" />
        <SectionHeading className="mt-4">
          Lightweight by design, complete by workflow
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
          Keep the essential loop in one place so small teams can move faster
          and stay consistent as pipeline volume grows.
        </SubHeading>
      </div>
      <div className="mt-20 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 grid-cols-1 gap-4">
          {landingBenefitCards.slice(0, 3).map((benefit, index) => (
            <Card key={benefit.title} {...benefit} icon={benefitIcons[index]} />
          ))}
        </div>
        <MiddleCard />
        <div className="grid min-w-0 grid-cols-1 gap-4">
          {landingBenefitCards.slice(3, 6).map((benefit, index) => (
            <Card
              key={benefit.title}
              {...benefit}
              icon={benefitIcons[index + 3]}
            />
          ))}
        </div>
      </div>
    </Container>
  );
};

const MiddleCard = () => {
  const workflowSteps = [
    {
      label: "Target list",
      value: "42 ICP accounts",
      meta: "Synced",
    },
    {
      label: "Account research",
      value: "8 briefs generated",
      meta: "Context ready",
    },
    {
      label: "Contacts",
      value: "24 decision-makers",
      meta: "Scored",
    },
    {
      label: "Outreach draft",
      value: "12 messages ready",
      meta: "Next action",
    },
  ];

  return (
    <div className="relative min-w-0 overflow-hidden rounded-lg border border-neutral-200/70 bg-gray-50 p-4 sm:p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] opacity-60 [background-size:12px_12px]" />
      <div className="absolute inset-x-8 top-24 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
      <div className="absolute inset-x-8 bottom-24 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

      <div className="relative z-10 rounded-md border border-neutral-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-neutral-500 uppercase dark:text-neutral-400">
              Prospecting workflow
            </p>
            <h3 className="mt-2 text-lg font-semibold text-neutral-950 dark:text-white">
              From account list to first draft
            </h3>
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            <LogoSVG className="size-5 opacity-70 grayscale" />
          </div>
        </div>

        <div className="relative mt-6">
          <div className="absolute top-4 bottom-4 left-[15px] w-px bg-neutral-200 dark:bg-neutral-800" />
          <motion.div
            className="absolute top-4 left-[15px] w-px bg-neutral-900 dark:bg-neutral-200"
            initial={{ height: 0 }}
            whileInView={{ height: "calc(100% - 2rem)" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <div className="space-y-3">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.label}
                className="relative grid grid-cols-[2rem_1fr] gap-3"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <div className="relative z-10 mt-1 flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                  {index + 1}
                </div>
                <div className="min-w-0 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/80">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-950 dark:text-white">
                        {step.label}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        {step.value}
                      </p>
                    </div>
                    <span className="w-fit shrink-0 rounded-full border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
                      {step.meta}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-950 p-3 text-white dark:border-neutral-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-neutral-400">Next best action</p>
              <p className="mt-1 text-sm font-medium">
                Review 3 high-fit contacts before sending
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">89</p>
              <p className="text-xs text-neutral-400">top score</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              whileInView={{ width: "82%" }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = (props: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  const { title, description, icon } = props;
  return (
    <div className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-transparent md:p-5 dark:bg-neutral-800">
      <div className="flex items-center gap-2">{icon}</div>
      <h3 className="mt-4 mb-2 text-lg font-medium">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

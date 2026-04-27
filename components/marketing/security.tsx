import React from "react";
import { Container } from "./container";
import { Badge } from "./badge";
import { SectionHeading } from "./section-heading";
import { SubHeading } from "./subheading";
import {
  prospectKitDoes,
  prospectKitDoesNot,
} from "@/lib/marketing/landing-content";
import { CheckCircle2, MinusCircle, ShieldCheck } from "lucide-react";

export const Security = () => {
  return (
    <Container
      id="boundaries"
      className="border-divide border-x px-4 py-16 md:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <Badge text="Boundaries" />
        <SectionHeading className="mt-4">
          What ProspectKit does and does not do
        </SectionHeading>
        <SubHeading as="p" className="mx-auto mt-6 max-w-2xl">
          ProspectKit is intentionally focused on pre-send prospecting and
          qualification workflows for tiny teams.
        </SubHeading>
      </div>

      <div className="relative mx-auto mt-12 max-w-6xl overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_35%)]" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr]">
          <BoundaryColumn
            eyebrow="Focus area"
            title="Does"
            description="The operating layer for pre-send prospecting."
            items={prospectKitDoes}
            tone="positive"
          />

          <div className="hidden w-px bg-neutral-200 lg:block dark:bg-neutral-800" />

          <BoundaryColumn
            eyebrow="Out of scope"
            title="Does not"
            description="Boundaries that keep the product lean."
            items={prospectKitDoesNot}
            tone="neutral"
          />
        </div>
      </div>
    </Container>
  );
};

type BoundaryColumnProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: typeof prospectKitDoes;
  tone: "positive" | "neutral";
};

function BoundaryColumn({
  eyebrow,
  title,
  description,
  items,
  tone,
}: BoundaryColumnProps) {
  const isPositive = tone === "positive";
  const Icon = isPositive ? CheckCircle2 : MinusCircle;

  return (
    <section className="relative min-w-0 p-5 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-neutral-500 uppercase dark:text-neutral-400">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-neutral-950 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
            {description}
          </p>
        </div>
        <div
          className={
            isPositive
              ? "flex size-11 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "flex size-11 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
          }
        >
          {isPositive ? (
            <ShieldCheck className="size-5" />
          ) : (
            <MinusCircle className="size-5" />
          )}
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {items.map((item, index) => (
          <article
            key={item.title}
            className="group rounded-md border border-neutral-200 bg-white/75 p-4 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/50 dark:hover:bg-neutral-900"
          >
            <div className="flex gap-3">
              <div
                className={
                  isPositive
                    ? "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
                }
              >
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400">
                    0{index + 1}
                  </span>
                  <h4 className="text-sm font-medium text-neutral-950 dark:text-neutral-100">
                    {item.title}
                  </h4>
                </div>
                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {item.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

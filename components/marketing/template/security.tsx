import React from "react";
import { Container } from "./container";
import { Badge } from "./badge";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";
import {
  prospectKitDoes,
  prospectKitDoesNot,
} from "@/lib/marketing/landing-content";

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

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-green-200 bg-green-50/60 p-6 dark:border-green-900 dark:bg-green-950/20">
          <h3 className="text-sm font-mono uppercase tracking-wide text-green-700 dark:text-green-300">
            Does
          </h3>
          <div className="mt-4 space-y-4">
            {prospectKitDoes.map((item) => (
              <article key={item.title}>
                <h4 className="text-charcoal-700 text-base font-medium dark:text-neutral-100">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm text-gray-700 dark:text-neutral-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-rose-200 bg-rose-50/60 p-6 dark:border-rose-900 dark:bg-rose-950/20">
          <h3 className="text-sm font-mono uppercase tracking-wide text-rose-700 dark:text-rose-300">
            Does not
          </h3>
          <div className="mt-4 space-y-4">
            {prospectKitDoesNot.map((item) => (
              <article key={item.title}>
                <h4 className="text-charcoal-700 text-base font-medium dark:text-neutral-100">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm text-gray-700 dark:text-neutral-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
};

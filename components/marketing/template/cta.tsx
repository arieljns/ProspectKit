"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Container } from "./container";
import { SectionHeading } from "./seciton-heading";
import { Button } from "./button";
import { landingLinks } from "@/lib/marketing/landing-content";
import { LogoSVG } from "./logo";

export function CTA() {
  return (
    <Container
      id="cta"
      className="border-divide relative flex min-h-72 flex-col items-center justify-center overflow-hidden border-x px-4 py-12 md:min-h-[30rem]"
    >
      <CTAOrbit className="absolute inset-x-0 -top-96 mask-b-from-30%" />
      <SectionHeading className="relative z-10 text-center lg:text-6xl">
        Complete the essential SDR loop
        <br />
        with a tiny team
      </SectionHeading>
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button as={Link} href={landingLinks.primaryCta}>
          Try the demo
        </Button>
        <Button as="a" href={landingLinks.repo} target="_blank" rel="noreferrer" variant="secondary">
          Explore the code
        </Button>
      </div>
    </Container>
  );
}

type CTAOrbitProps = {
  size?: number;
  className?: string;
};

function CTAOrbit({ size = 780, className }: CTAOrbitProps) {
  const ringScaleFactors = [0.44, 0.66, 0.9];
  const durations = [16, 22, 28];

  return (
    <div className={className} style={{ width: size, height: size }}>
      <div className="absolute inset-0 flex items-center justify-center">
        {ringScaleFactors.map((scale, index) => (
          <div
            key={`ring-bg-${index}`}
            className="absolute rounded-full shadow-inner"
            style={{
              width: Math.round(size * scale),
              height: Math.round(size * scale),
              backgroundColor: index === 0 ? "var(--color-neutral-300)" : "var(--color-neutral-200)",
            }}
          />
        ))}
      </div>

      {ringScaleFactors.map((scale, index) => (
        <motion.div
          key={`ring-${index}`}
          className="absolute top-1/2 left-1/2"
          style={{
            width: Math.round(size * scale),
            height: Math.round(size * scale),
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={{ rotate: index % 2 === 0 ? 360 : -360 }}
          transition={{ duration: durations[index], repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 4 + index * 2 }).map((_, dotIndex, list) => {
            const angle = (360 / list.length) * dotIndex;
            const radius = (Math.round(size * scale) / 2) * 0.88;
            return (
              <div
                key={`${index}-${dotIndex}`}
                className="absolute top-1/2 left-1/2"
                style={{
                  transform: `rotate(${angle}deg) translateX(${radius}px)`,
                }}
              >
                <div
                  className="shadow-aceternity flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md bg-white dark:bg-neutral-950"
                  style={{ transform: `rotate(${-angle}deg)` }}
                >
                  <LogoSVG className="size-4" />
                </div>
              </div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

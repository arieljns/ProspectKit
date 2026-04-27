"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Container } from "./container";
import { SectionHeading } from "./section-heading";
import { Button } from "./button";
import { landingLinks } from "@/lib/marketing/landing-content";
import { LogoSVG } from "./logo";

export function CTA() {
  return (
    <Container
      id="cta"
      className="border-divide relative flex min-h-72 flex-col items-center justify-center overflow-hidden border-x px-4 py-12 md:min-h-[30rem]"
    >
      <CTAOrbit className="pointer-events-none absolute left-1/2 -top-80 -translate-x-1/2 mask-b-from-35%" />
      <SectionHeading className="relative z-10 text-center lg:text-6xl">
        Complete the essential SDR loop
        <br />
        with a tiny team
      </SectionHeading>
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button as={Link} href={landingLinks.primaryCta}>
          Try the demo
        </Button>
        <Button
          as="a"
          href={landingLinks.repo}
          target="_blank"
          rel="noreferrer"
          variant="secondary"
        >
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
  const rings = [0.42, 0.64, 0.86];
  const orbitGroups = [
    {
      scale: 0.64,
      count: 5,
      duration: 38,
      direction: 360,
      logoClassName: "size-10 opacity-30 dark:opacity-35",
    },
    {
      scale: 0.86,
      count: 7,
      duration: 54,
      direction: -360,
      logoClassName: "size-12 opacity-25 dark:opacity-30",
    },
  ];

  return (
    <div className={className} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(229,229,229,0.7)_0%,rgba(245,245,245,0.42)_38%,rgba(255,255,255,0)_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(64,64,64,0.42)_0%,rgba(23,23,23,0.34)_42%,rgba(0,0,0,0)_72%)]" />

      <div className="absolute inset-0 flex items-center justify-center">
        {rings.map((scale, index) => (
          <div
            key={`ring-${index}`}
            className="absolute rounded-full border border-neutral-300/70 dark:border-neutral-800"
            style={{
              width: Math.round(size * scale),
              height: Math.round(size * scale),
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <LogoSVG className="size-44 opacity-[0.09] drop-shadow-sm grayscale dark:opacity-[0.14]" />
      </div>

      {orbitGroups.map((group, groupIndex) => (
        <motion.div
          key={`orbit-${groupIndex}`}
          className="absolute top-1/2 left-1/2"
          style={{
            width: Math.round(size * group.scale),
            height: Math.round(size * group.scale),
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={{ rotate: group.direction }}
          transition={{
            duration: group.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {Array.from({ length: group.count }).map((_, dotIndex, list) => {
            const angle = (360 / list.length) * dotIndex;
            const radius = (Math.round(size * group.scale) / 2) * 0.93;

            return (
              <div
                key={`${groupIndex}-${dotIndex}`}
                className="absolute top-1/2 left-1/2"
                style={{
                  transform: `rotate(${angle}deg) translateX(${radius}px)`,
                }}
              >
                <div
                  className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ transform: `rotate(${-angle}deg)` }}
                >
                  <LogoSVG
                    className={`${group.logoClassName} drop-shadow-sm grayscale`}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Container } from "./container";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { logos } from "@/constants/logos";

export const LogoCloud = () => {
  // Track which logos are currently displayed (indices)
  const [displayedIndices, setDisplayedIndices] = useState<number[]>(() =>
    Array.from({ length: 8 }, (_, i) => i),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const notDisplayedIndices = logos
        .map((_, index) => index)
        .filter((index) => !displayedIndices.includes(index));

      if (notDisplayedIndices.length > 0) {
        const randomDisplayedIndex = Math.floor(
          Math.random() * displayedIndices.length,
        );
        const positionToReplace = randomDisplayedIndex;

        const randomNotDisplayedIndex = Math.floor(
          Math.random() * notDisplayedIndices.length,
        );
        const newLogoIndex = notDisplayedIndices[randomNotDisplayedIndex];

        setDisplayedIndices((prev) => {
          const newIndices = [...prev];
          newIndices[positionToReplace] = newLogoIndex;
          return newIndices;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [displayedIndices]);

  return (
    <Container id="proof" className="border-divide border-x">
      <div className="border-divide grid gap-6 border-b px-6 py-10 md:grid-cols-[1fr_auto] md:items-end md:px-10">
        <div>
          <p className="font-mono text-sm text-neutral-500 uppercase dark:text-gray-400">
            Accelerator-backed teams
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-neutral-950 md:text-5xl dark:text-white">
            Used by 10+ startups from top accelerators
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-6 text-sm md:min-w-80">
          <div>
            <p className="text-2xl font-semibold text-neutral-950 dark:text-white">
              10+
            </p>
            <p className="mt-1 text-neutral-500 dark:text-gray-400">
              startups
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-neutral-950 dark:text-white">
              Top
            </p>
            <p className="mt-1 text-neutral-500 dark:text-gray-400">
              accelerators
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-neutral-950 dark:text-white">
              SDR
            </p>
            <p className="mt-1 text-neutral-500 dark:text-gray-400">
              workflows
            </p>
          </div>
        </div>
      </div>

      <div className="border-divide grid grid-cols-2 md:grid-cols-4">
        {displayedIndices.map((logoIndex, position) => {
          const logo = logos[logoIndex];

          return (
            <div
              key={position}
              className={cn(
                "border-divide group relative overflow-hidden",
                "border-r md:border-r-0",
                position % 2 === 0 ? "border-r" : "",
                position < 6 ? "border-b md:border-b-0" : "",
                "md:border-r-0",
                position % 4 !== 3 ? "md:border-r" : "",
                position < 4 ? "md:border-b" : "",
              )}
            >
              <div className="animate-move-left-to-right bg-brand/5 absolute inset-x-0 bottom-0 h-full translate-y-full transition-all duration-200 group-hover:translate-y-0"></div>
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={logoIndex}
                  className="group flex min-h-32 items-center justify-center p-4 py-10 grayscale"
                  initial={{
                    y: 100,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -100,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    opacity: 1,
                  }}
                >
                  <motion.img
                    src={logo.src}
                    alt={logo.title}
                    className={cn(
                      "h-8 w-auto object-contain transition-all duration-500 dark:invert dark:filter",
                      logo.className,
                    )}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Container>
  );
};

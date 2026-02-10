"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import { CloseIcon, HamburgerIcon } from "@/icons/general";
import { landingLinks, landingNavItems } from "@/lib/marketing/landing-content";
import { Button } from "./button";
import { Container } from "./container";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";

export function MarketingNav() {
  return (
    <Container as="nav">
      <FloatingNav />
      <DesktopNav />
      <MobileNav />
    </Container>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-between p-2 md:hidden">
      <Logo />
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="shadow-aceternity flex size-7 items-center justify-center rounded-md"
        aria-label="Toggle menu"
      >
        <HamburgerIcon className="size-4 shrink-0 text-gray-600 dark:text-gray-300" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] h-full w-full bg-white shadow-lg dark:bg-neutral-900"
          >
            <div className="absolute right-4 bottom-4">
              <ModeToggle />
            </div>

            <div className="flex items-center justify-between p-2">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="shadow-aceternity flex size-7 items-center justify-center rounded-md"
                aria-label="Close menu"
              >
                <CloseIcon className="size-4 shrink-0 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="divide-divide border-divide mt-6 flex flex-col divide-y border-t">
              {landingNavItems.map((item, index) => (
                <a
                  href={item.href}
                  key={item.title}
                  className="px-4 py-2 font-medium text-gray-600 transition hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-100"
                  onClick={() => setOpen(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2, delay: index * 0.06 }}
                  >
                    {item.title}
                  </motion.div>
                </a>
              ))}

              <div className="mt-4 grid gap-2 p-4">
                <Button as={Link} href={landingLinks.primaryCta} onClick={() => setOpen(false)}>
                  Try the demo
                </Button>
                <Button as="a" href={landingLinks.repo} target="_blank" rel="noreferrer" variant="secondary">
                  View source
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DesktopNav() {
  return (
    <div className="hidden items-center justify-between px-4 py-4 md:flex">
      <Logo />
      <div className="flex items-center gap-8">
        {landingNavItems.map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="font-medium text-gray-600 transition hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-100"
          >
            {item.title}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button as="a" href={landingLinks.repo} target="_blank" rel="noreferrer" variant="secondary">
          Source
        </Button>
        <Button as={Link} href={landingLinks.primaryCta}>
          Try demo
        </Button>
      </div>
    </div>
  );
}

function FloatingNav() {
  const { scrollY } = useScroll();
  const y = useSpring(useTransform(scrollY, [80, 120], [-100, 12]), {
    stiffness: 300,
    damping: 30,
  });

  return (
    <motion.div
      style={{ y }}
      className="shadow-aceternity fixed inset-x-0 top-0 z-50 mx-auto hidden max-w-[calc(80rem-4rem)] items-center justify-between bg-white/80 px-3 py-2 backdrop-blur-sm md:flex xl:rounded-2xl dark:bg-neutral-900/80"
    >
      <Logo />
      <div className="flex items-center gap-8">
        {landingNavItems.map((item) => (
          <a
            key={`floating-${item.title}`}
            href={item.href}
            className="font-medium text-gray-600 transition hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-100"
          >
            {item.title}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button as="a" href={landingLinks.repo} target="_blank" rel="noreferrer" variant="secondary">
          Source
        </Button>
        <Button as={Link} href={landingLinks.primaryCta}>
          Try demo
        </Button>
      </div>
    </motion.div>
  );
}

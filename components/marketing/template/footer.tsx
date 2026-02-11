import Link from "next/link";
import { Container } from "./container";
import { Logo } from "./logo";
import { SubHeading } from "./subheading";
import { Button } from "./button";
import { landingLinks, landingNavItems } from "@/lib/marketing/landing-content";

export function Footer() {
  return (
    <Container className="border-divide border-x">
      <div className="grid grid-cols-1 gap-10 px-4 py-16 md:grid-cols-3">
        <div>
          <Logo />
          <SubHeading as="p" className="mt-4 max-w-md text-left">
            Open-source SDR workspace built for early-stage startups and lean
            sales teams.
          </SubHeading>
          <div className="mt-5 flex gap-2">
            <Button as={Link} href={landingLinks.primaryCta}>
              Try demo
            </Button>
            <Button as="a" href={landingLinks.repo} target="_blank" rel="noreferrer" variant="secondary">
              GitHub
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-600 dark:text-neutral-300">Sections</p>
            {landingNavItems.map((item) => (
              <a key={item.title} href={item.href} className="text-footer-link text-sm font-medium">
                {item.title}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-600 dark:text-neutral-300">Project</p>
            <a href={landingLinks.repo} className="text-footer-link text-sm font-medium" target="_blank" rel="noreferrer">
              Repository
            </a>
            <a href={landingLinks.sponsor} className="text-footer-link text-sm font-medium" target="_blank" rel="noreferrer">
              Sponsor
            </a>
            <a href={landingLinks.contact} className="text-footer-link text-sm font-medium">
              Contact
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-gray-300 bg-gray-100 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm font-medium">Open-source note</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300">
            Structure and visuals are in active iteration. Copy and messaging
            will be refined in the next pass.
          </p>
        </div>
      </div>
      <div className="border-divide flex flex-col items-center justify-between gap-2 border-t px-4 py-6 text-sm md:flex-row">
        <p className="text-footer-link">
          © {new Date().getFullYear()} ProspectKit. All rights reserved.
        </p>
        <div className="flex gap-4">
          <Link href={landingLinks.primaryCta} className="text-footer-link">
            App
          </Link>
          <a href={landingLinks.repo} className="text-footer-link" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={landingLinks.sponsor} className="text-footer-link" target="_blank" rel="noreferrer">
            Sponsor
          </a>
        </div>
      </div>
    </Container>
  );
}

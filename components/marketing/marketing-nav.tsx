import Link from "next/link";

import { Button } from "@/components/shadcnui/button";
import { ORBIT_REPO_URL } from "@/lib/marketing/links";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold tracking-tight">
            Orbit SDR
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Clay/Apollo-lite for small teams
          </span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href={ORBIT_REPO_URL} target="_blank" rel="noreferrer">
              View source
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/app">Try the demo</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}


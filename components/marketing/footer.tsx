import Link from "next/link";

import { ORBIT_CONTACT_MAILTO, ORBIT_REPO_URL, ORBIT_SPONSOR_URL } from "@/lib/marketing/links";

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Orbit SDR</span> — open-source SDR for small teams.
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/app" className="text-muted-foreground hover:text-foreground">
            App
          </Link>
          <a className="text-muted-foreground hover:text-foreground" href={ORBIT_REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="text-muted-foreground hover:text-foreground" href={ORBIT_SPONSOR_URL} target="_blank" rel="noreferrer">
            Sponsor
          </a>
          <a className="text-muted-foreground hover:text-foreground" href={ORBIT_CONTACT_MAILTO}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}


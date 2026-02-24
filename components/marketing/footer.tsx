import Link from "next/link";

import {
  PROSPECTKIT_CONTACT_MAILTO,
  PROSPECTKIT_REPO_URL,
  PROSPECTKIT_SPONSOR_URL,
} from "@/lib/marketing/links";

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">ProspectKit</span> —
          open-source outbound workspace for small teams.
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link
            href="/app"
            className="text-muted-foreground hover:text-foreground"
          >
            App
          </Link>
          <a
            className="text-muted-foreground hover:text-foreground"
            href={PROSPECTKIT_REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="text-muted-foreground hover:text-foreground"
            href={PROSPECTKIT_SPONSOR_URL}
            target="_blank"
            rel="noreferrer"
          >
            Sponsor
          </a>
          <a
            className="text-muted-foreground hover:text-foreground"
            href={PROSPECTKIT_CONTACT_MAILTO}
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

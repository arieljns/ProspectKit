---
name: fullstack-worker
description: Full-stack worker for Next.js features — handles server actions, API routes, and React components
---

# Full-Stack Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use for features that span the full stack: server-side data loading (actions/repositories), API routes, and client-side React components. This includes new pages, new API endpoints, UI sections, and orchestration logic.

## Required Skills

- `agent-browser` — Used for manual verification of UI features. Invoke after implementation to verify rendering, interactions, and state transitions in the browser.

## Work Procedure

### 1. Read Context

- Read `mission.md`, `AGENTS.md`, `.factory/library/architecture.md` for patterns and conventions.
- Read `.factory/services.yaml` for commands.
- Read the feature description, preconditions, expectedBehavior, and verificationSteps carefully.
- Identify which existing files you'll modify and which new files you'll create.

### 2. Plan Implementation

Before writing code:
- List all files to create/modify.
- Identify which existing patterns to follow (check existing similar files).
- Note any data types, schemas, or utilities you'll reuse.

### 3. Implement Server-Side First

Build bottom-up:
1. **Repository functions** (if new DB queries needed) — follow pattern in `lib/server/repositories/`.
2. **Server actions** (if needed for data loading) — follow pattern in `lib/actions/` with `"use server"` directive.
3. **Service functions** (if new business logic) — follow `ServiceResult` pattern in `lib/server/services/`.
4. **API routes** (if new endpoints) — follow thin HTTP adapter pattern in `app/api/`.

### 4. Implement Client-Side

Build the UI:
1. **Page component** (server component) — follow pattern: `export const dynamic = "force-dynamic"`, use `SiteHeader`, standard flex layout.
2. **Client components** — `"use client"` directive, controlled state with `useState`, `sonner` toast for feedback.
3. **Shared components** — reuse from `components/shared/ui/` (shadcn/ui pattern).

### 5. Run Validators

Run these commands and fix ALL errors before proceeding:
```bash
pnpm exec tsc --noEmit    # TypeScript must pass with zero errors
pnpm lint                  # ESLint must pass with zero errors
```

### 6. Manual Verification with agent-browser

Invoke the `agent-browser` skill to verify your work in the browser:
- Start the dev server if not running.
- Navigate to the relevant page.
- Verify each expectedBehavior item visually.
- Check for console errors.
- Test interactions (clicks, state transitions).

Record each check as an `interactiveChecks` entry in your handoff.

### 7. Cleanup

- Kill any dev server processes you started.
- Ensure no orphaned processes.

## Example Handoff

```json
{
  "salientSummary": "Implemented the aggregated brief data loader as a server action `getBriefData(companyId)` that returns company, report, contacts, and scores in one call. Created the brief page at /app/brief/[companyId] with BriefHeader showing company metadata and completion state. Verified with tsc (0 errors), lint (0 errors), and agent-browser (page loads, company name renders, empty state shows correctly).",
  "whatWasImplemented": "Server action `getBriefData` in lib/actions/briefs.ts that aggregates company, report, contacts+scores data. Brief page route at app/(workspace)/app/brief/[companyId]/page.tsx with BriefHeader component showing company name, industry, website, priority, and completion indicator. Empty state rendering for all sections.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm exec tsc --noEmit", "exitCode": 0, "observation": "Zero type errors" },
      { "command": "pnpm lint", "exitCode": 0, "observation": "Zero lint errors" }
    ],
    "interactiveChecks": [
      { "action": "Navigated to /app/brief/[companyId] for a company with no data", "observed": "Page loads with company name in header, all sections show empty state, Generate Brief button visible and enabled" },
      { "action": "Navigated to /app/brief/[companyId] for a company with existing report", "observed": "Research section shows report summary, other sections show empty state, completion indicator shows partial" },
      { "action": "Checked browser console for errors", "observed": "Zero console errors on page load" }
    ]
  },
  "tests": { "added": [] },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Feature depends on a component or API that doesn't exist yet and isn't in the feature description
- The existing service/action interface doesn't match what the feature needs
- TypeScript or lint errors that require changes outside your feature's scope
- Database schema changes are needed (out of scope for this mission)
- Build or runtime errors in existing code that block your work

# ProspectKit Architecture

## 1. System Overview

ProspectKit is an AI-powered sales prospecting application. Users manage target companies, research them via web search, discover contacts, score leads, and generate outreach messages — all driven by LLM orchestration.

```
┌─────────────────────────────────────────────────────────┐
│  Next.js App Router (UI)                                │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ Server Pages  │  │ Client Comp │  │ Server Actions│  │
│  └──────┬───────┘  └──────┬──────┘  └──────┬────────┘  │
│         │                 │                │            │
│         ▼                 ▼                ▼            │
│  ┌────────────────────────────────────────────────┐     │
│  │  API Routes (thin HTTP layer)                  │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     ▼                                   │
│  ┌────────────────────────────────────────────────┐     │
│  │  Service Layer (business logic + AI calls)     │     │
│  └──────────────────┬─────────────────────────────┘     │
│                     ▼                                   │
│  ┌─────────────────────────┐  ┌─────────────────────┐   │
│  │  Repository Layer (DB)  │  │  Exa Search (ext.)  │   │
│  └──────────┬──────────────┘  └─────────────────────┘   │
│             ▼                                           │
│  ┌─────────────────────────┐                            │
│  │  Postgres + Drizzle ORM │                            │
│  └─────────────────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

**Key technology choices**: Next.js 14 App Router, Vercel AI SDK v5 (`generateObject` / `streamText`), Drizzle ORM, PostgreSQL, Exa web search API.

---

## 2. Data Model

Five tables, all using `nanoid` string primary keys:

```
companies ──1:N──▶ company_reports
    │
    └──1:N──▶ contacts ──1:1──▶ lead_scores

scoring_config (singleton, id = "default")
```

### companies
Core entity. Stores company name, industry, size, website, description, priority (`High | Medium | Low`), and a denormalized `reportStatus` field (`none | generating | completed | failed`).

### company_reports
One report per company (upserted). Contains structured `reportData` JSON (summary, financials, products, market analysis, news, insights) and a `status` field. Foreign key to `companies` with cascade delete.

### contacts
People associated with a company. Tracks name, title, department, LinkedIn URL, contact status (`new | contacted | responded | qualified | not_interested`), and priority. Foreign key to `companies` with cascade delete.

### lead_scores
One score per contact (unique on `contactId`). Stores five integer dimension scores (0–100): industry match, company match, position match, seniority match, deal size. Includes optional JSON `reasoning`. Foreign key to `contacts` with cascade delete.

### scoring_config
Singleton row. Stores the user's company info, product description, target industries, target seniority levels, and dimension weights (must sum to 100). Used by the lead scoring service as evaluation context.

---

## 3. Service Layer Pattern

Services live under `lib/server/services/` grouped by domain:

| Service | Location | Purpose |
|---------|----------|---------|
| `generateCompanyReport` | `services/reports/` | Research a company via Exa → generate structured report via AI |
| `findContactsForCompany` | `services/contacts/` | Search Exa for contacts → extract via AI → persist |
| `scoreLeadForContact` | `services/leads/` | Enrich contact context via Exa → AI scoring → persist |
| `generateOutreachMessage` | `services/messages/` | Generate a personalized outreach message |

### ServiceResult convention

Every service returns `ServiceResult<T, Code>`:

```ts
type ServiceResult<T, Code extends string> =
  | { ok: true; data: T }
  | { ok: false; error: { code: Code; message: string; details?: unknown } }
```

Constructors: `ok(data)` and `err(code, message, details?)`.

Each service defines its own union of error codes (e.g. `"INVALID_INPUT" | "COMPANY_NOT_FOUND" | "EXTERNAL_SEARCH_FAILED" | ...`). Error codes are mapped to HTTP status codes at the API layer — the service itself never decides on HTTP semantics.

### Typical service structure

1. Validate input → early `err` on bad input.
2. Load entities from repositories → `err` if missing.
3. Call external API (Exa search) → `err` on failure.
4. Call AI via `generateObject` → `err` on generation failure.
5. Persist results via repositories → `err` on write failure.
6. Return `ok(output)`.

Services are marked `"server-only"` to prevent client bundling.

---

## 4. Repository Layer

Repositories live under `lib/server/repositories/`. One file per table:

- `companies-repo.ts` — `findCompanyById`, `setCompanyReportStatus`
- `company-reports-repo.ts` — `findCompanyReportByCompanyId`, `upsertCompanyReportByCompanyId`
- `contacts-repo.ts` — `insertContact`, `findContactWithCompanyById`, `findContactsByCompanyId`
- `lead-scores-repo.ts` — `upsertLeadScore`, `findLeadScoreByContactId`, `findLeadScoresByContactIds`
- `scoring-config-repo.ts` — `getOrCreateDefaultScoringConfig`

Repositories are pure data-access functions. They use Drizzle query builders directly and return plain row objects (or `null`). They do not contain business logic or error-code semantics.

---

## 5. API Route Pattern

API routes live under `app/api/` and follow a **thin HTTP adapter** pattern:

```ts
// app/api/reports/generate/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const result = await generateCompanyReport({ companyId: body.companyId });

  if (result.ok) {
    return Response.json({ success: true, data: result.data });
  }
  return toServiceJsonErrorResponse(result.error);
}
```

Responsibilities of an API route:
1. Parse the request body.
2. Delegate to the appropriate service.
3. Map the `ServiceResult` to an HTTP response using `toServiceJsonErrorResponse` (which maps error codes → HTTP status codes via a lookup table).

Routes do **not** contain business logic, database queries, or AI calls.

Existing routes:
- `POST /api/reports/generate` — company report generation
- `POST /api/contacts/find` — contact discovery
- `POST /api/leads/score` — lead scoring
- `POST /api/messages/generate` — outreach message generation
- `POST /api/companies/auto-fill` — company auto-fill from web
- `POST /api/contacts/auto-fill` — contact auto-fill from web

---

## 6. Server Action Pattern

Server actions live under `lib/actions/` and are marked `"use server"`. They serve Next.js server-side data fetching and mutations triggered from server components or client forms.

Actions use a simpler return shape than services:
```ts
{ success: true, data: T } | { success: false, error: string }
```

Actions call repositories directly for reads (e.g. `getAllCompanies`, `getCompanyById`) and may call `revalidatePath` for cache invalidation. They do **not** go through the service layer for simple CRUD — services are reserved for multi-step orchestrated operations.

---

## 7. UI Component Pattern

### Workspace layout

All application pages live under `app/(workspace)/app/`. The layout provides a sidebar-based shell:

```
(workspace)/app/layout.tsx   →  SidebarProvider + AppSidebar + SidebarInset
  └── dashboard/page.tsx     →  Server component: fetches data, renders table
  └── contacts/page.tsx
  └── analytics/page.tsx
  └── settings/page.tsx
```

### Server vs. client components

- **Page components** are async server components. They fetch data via server actions or direct repository calls, then render child components.
- **Interactive components** (tables, forms, buttons that trigger API calls) are `"use client"` components that receive server-fetched data as props.
- **Layout components** (`AppSidebar`, `SiteHeader`) use the `"use client"` directive for sidebar state management.

### Shared UI primitives

Reusable UI components live in `components/shared/ui/` (shadcn/ui pattern). Domain-specific components live in `components/workspace/`.

---

## 8. Company Prospecting Brief — New Feature Architecture

### What it is

A **derived, read-time view** that aggregates existing entities (company, report, contacts, lead scores) into a single company-focused prospecting workspace. No new database tables are introduced.

### New routes and components

```
app/(workspace)/app/brief/[companyId]/page.tsx   ← Server component (data loader)

app/api/briefs/generate/route.ts                 ← Orchestration API route

components/workspace/brief/
  ├── BriefHeader.tsx         ← Company context + "Generate Brief" action
  ├── ResearchSection.tsx     ← Report status + findings
  ├── ContactsSection.tsx     ← Discovered contacts list
  ├── ScoringSection.tsx      ← Ranked contacts with scores
  ├── OutreachSection.tsx     ← Top contacts + message generation
  └── BriefRunController.tsx  ← Client-side orchestration state machine
```

### Data flow

```
                    ┌─────────────────────────────┐
                    │  brief/[companyId]/page.tsx  │
                    │  (server component)          │
                    └─────────┬───────────────────┘
                              │ aggregated load
                              ▼
              ┌───────────────────────────────────┐
              │  Parallel repository reads:        │
              │  • company                         │
              │  • company_report (by companyId)   │
              │  • contacts (by companyId)          │
              │  • lead_scores (for those contacts)│
              └───────────────┬───────────────────┘
                              │ props
                              ▼
              ┌───────────────────────────────────┐
              │  Section components render         │
              │  current state: empty/success/error│
              └───────────────────────────────────┘
```

### Orchestration: `POST /api/briefs/generate`

The orchestration route runs the full brief generation as a **sequential pipeline**, reusing existing services:

```
1. generateCompanyReport(companyId)
       ↓ (success required to continue)
2. findContactsForCompany(companyId)
       ↓ (success required to continue)
3. for each contact: scoreLeadForContact(contactId)
       ↓ (partial failure tolerated)
4. Return step-by-step result summary
```

The route is a thin orchestrator — it calls existing services in sequence and aggregates their `ServiceResult` outcomes. It does not duplicate any service logic.

### Client-side orchestration: BriefRunController

`BriefRunController` is a client component that:
- Calls `POST /api/briefs/generate` when the user clicks "Generate Brief"
- Tracks per-section status (`empty | running | success | error`) in local state
- Updates section states as the orchestration progresses (via polling or response parsing)
- Supports per-section reruns by calling the existing individual API routes

### Section state model

Every section maintains one of four states:

| State | Meaning |
|-------|---------|
| `empty` | No data exists yet for this section |
| `running` | An operation is in progress |
| `success` | Data is available and current |
| `error` | Last operation failed (prior successful data, if any, remains visible) |

The page supports **mixed states** — a failure in scoring does not hide completed research or contacts. Partial success is always preserved.

---

## 9. Key Invariants

1. **No new tables** — the brief is a derived view over `companies`, `company_reports`, `contacts`, and `lead_scores`. No `briefs` table is introduced.

2. **Sequential orchestration** — the full brief generation runs steps in order (report → contacts → scoring). Each step depends on the output of the previous one.

3. **Partial failure tolerance** — a failure in a later step preserves results from earlier steps. Scoring failure for one contact does not roll back other scores.

4. **4-state model** — every section is always in exactly one of `empty | running | success | error`. The UI must handle all four.

5. **Service reuse** — the orchestration route calls existing services; it does not bypass them or duplicate their logic.

6. **Thin HTTP layer** — API routes parse requests and map `ServiceResult` to HTTP responses. They contain no business logic.

7. **On-demand outreach** — outreach messages are generated per-contact on user action, not as part of the automatic brief pipeline.

8. **Idempotent reruns** — each section can be rerun independently. Reports and scores are upserted, so reruns overwrite prior results rather than creating duplicates.

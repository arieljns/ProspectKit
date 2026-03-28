# User Testing

## Validation Surface

**Primary surface:** Web browser (Next.js app at localhost:3000)
**Tool:** `agent-browser` for all UI validation assertions; `curl` for API-only assertions

**Setup steps:**
1. Start dev server: `pnpm dev` (auto-migrates DB, starts Next.js on port 3000)
2. Seed demo data if needed: `pnpm db:seed`
3. Navigate to `/app/dashboard` to access the company list
4. Navigate to `/app/brief/[companyId]` for the brief page

**Auth:** None — the app has no authentication system.

**Known constraints:**
- AI-dependent operations (report generation, contact discovery, scoring, outreach) require real API calls to xAI/OpenAI and Exa — they take 10-30 seconds each
- No test/mock mode exists — all operations hit real external APIs

## Validation Concurrency

**Machine:** 24 GB RAM, 10 CPU cores
**Baseline usage:** ~10 GB used by system processes
**Available headroom:** ~14 GB * 0.7 = ~9.8 GB usable

**agent-browser surface:**
- Dev server: ~1.7 GB RAM
- Per agent-browser instance: ~400 MB
- Max concurrent validators: **4** (1.7 + 4*0.4 = 3.3 GB, well within budget)
- Rationale: App is lightweight, but AI operations may spike CPU. Conservative limit of 4.

**Important:** Many assertions require AI operations that take 10-30 seconds. Validators must wait adequate time for these operations to complete.

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

## Available Test Companies

| Company | ID | Report | Contacts | Scores | Use For |
|---------|-----|--------|----------|--------|---------|
| Stripe | scq0fk030ihsskiuilm69 | ✅ completed | ✅ 5 | ✅ 5 | Success state testing, outreach |
| xAI | delngtdbuimkdqewm6ebn | ✅ completed | ✅ 5 | ✅ 5 | Success state testing, scoring |
| Hugging Face | 79814zad3c1te68800dzl | ✅ completed | ❌ | ❌ | Partial data, contacts testing |
| Vercel | dbszhnovj08xkuwutxqr5 | ❌ | ❌ | ❌ | Empty state, research testing |
| Notion | uv7j1t0uof6la7h0jh302 | ❌ | ❌ | ❌ | Empty state, orchestration testing |
| Figma | n12jernu80nur47sce3mu | ❌ | ❌ | ❌ | Empty state, spare |
| Linear | 9vh76xwsyaa3q8x3yt0lr | ❌ | ❌ | ❌ | Empty state, spare |

## Flow Validator Guidance: agent-browser

**Session naming:** Use `e39e5f7a7956__<flow-id>` pattern for session names (e.g., `e39e5f7a7956__flowA`).

**App URL:** http://localhost:3000

**No authentication required.** The app has no auth system — all pages are directly accessible.

**Key routes:**
- Dashboard: `/app/dashboard`
- Brief page: `/app/brief/[companyId]`
- Invalid brief: `/app/brief/nonexistent-id`

**Isolation rules:**
- Each flow validator uses its OWN browser session (`--session` flag)
- Each flow validator tests against SPECIFIC companies assigned to it — never touch other companies
- Do NOT click "Generate Brief" or any mutation button on companies assigned to other validators
- Read-only flows (navigation, viewing existing data) are safe to run concurrently
- Mutation flows (generating reports, finding contacts, scoring) must operate on separate companies

**Timing:**
- AI operations (report generation, contact discovery, scoring) take 10-30 seconds each
- After clicking a generate/run button, wait at least 30 seconds for completion
- Use sleep or polling to wait for operations to complete
- Full "Generate Brief" orchestration takes 60-120 seconds (report + contacts + scoring)

**Evidence collection:**
- Take screenshots at key states as evidence
- Save screenshots to the evidence directory provided in the prompt

**Error detection:**
- Check for console errors when validating error pages
- Look for raw error codes / stack traces (should be product-friendly language instead)

## Flow Validator Guidance: curl

**Base URL:** http://localhost:3000

**Orchestration endpoint:** POST /api/briefs/generate
- Body: `{ "companyId": "<id>" }`
- Success: 200 with step results JSON
- Missing companyId: 400
- Invalid companyId: 404

**No auth headers needed.**

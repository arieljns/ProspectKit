# Company Prospecting Brief Design

Date: 2026-03-27
Status: Approved for planning

## Summary

Build a new `Company Prospecting Brief` experience for ProspectKit. The brief is a company-centered workspace that turns the existing prototype capabilities into one demo-friendly flow:

1. research a company
2. find relevant contacts
3. score those contacts
4. generate outreach suggestions for the best leads

The first version is optimized for a 10-minute founder demo. It should show that AI can compress manual prospecting prep into one actionable package without forcing the user to jump across multiple pages.

## Context

The current product already has these capabilities:

- company research
- contact discovery
- lead scoring
- outreach message generation
- analytics and settings pages

The main gap is orchestration. Today the user sees separate tools more than a single prospecting workflow. For the next step, the product should present one coherent story around a single company rather than adding another isolated feature.

## Product Goal

Help a founder or small team open one company and quickly get a complete prospecting package:

- company context
- who to contact
- who is highest priority
- why they are high priority
- what to send next

## Audience

Primary audience: founders and small teams evaluating whether AI can replace the repetitive preparation work behind outbound prospecting.

Demo goal: within 10 minutes, a viewer should understand that ProspectKit can turn one target company into a ready-to-act brief.

## Scope

### In Scope

- a new company-level brief page
- one-click generation of a full brief
- step-by-step visibility into report generation, contact discovery, and lead scoring
- recommendation display for the best contacts
- outreach generation entry points for the top contacts
- per-section rerun controls
- clear empty, loading, success, and error states

### Out of Scope

- background job queues
- batch runs across multiple companies
- persisted outreach drafts or message history
- collaboration features
- approval workflows
- expanded analytics work

## Core Experience

### Entry Point

The user starts from the dashboard, selects a company, and lands on the company brief page. The dashboard remains the company discovery surface, but the brief becomes the main demo stage.

### Main Promise

The brief page must answer one question clearly:

`If I want to prospect this company, who should I contact and what should I do next?`

### Interaction Model

The brief uses a mixed interaction model:

- default action: one-click `Generate Brief`
- advanced control: each section can be run or rerun independently

This preserves demo simplicity while keeping the workflow inspectable and recoverable.

## Information Architecture

The page is organized into five sections.

### 1. Brief Header

Shows:

- company name
- industry
- website
- priority
- overall brief completion state
- primary `Generate Brief` action

Purpose:

- establish context immediately
- show whether the brief is incomplete, running, or ready
- provide a single obvious action for the demo

### 2. Research Section

Shows:

- current report status
- brief summary or key findings when available
- run/rerun action
- failure message and retry affordance when needed

Purpose:

- give context for why the company matters
- anchor the rest of the brief in company-specific information

### 3. Contacts Section

Shows:

- discovered contacts for the company
- title and company context
- empty state when no contacts exist
- run/rerun action

Purpose:

- answer who the likely decision-makers are
- prioritize useful contacts over generic table management behavior

### 4. Scoring Section

Shows:

- score grade
- total score
- short reasoning
- ranking of the most promising contacts
- run/rerun action

Purpose:

- explain why some contacts should be contacted before others
- convert raw enrichment into prioritization

### 5. Outreach Section

Shows:

- top 1-3 recommended contacts
- per-contact action to generate an outreach message
- generated message results on demand

Purpose:

- end the demo on a concrete action
- show that the brief is not just analysis, but execution support

## Detailed Flow

### Initial Load

When the user opens the brief page, the server loads all existing data related to the selected company:

- company record
- company report
- contacts for that company
- lead scores for those contacts

The page renders the current state without forcing a rerun.

### Generate Brief

When the user clicks `Generate Brief`, the system runs these steps in order:

1. generate the company report
2. discover contacts for the company
3. score all contacts currently attached to the company
4. refresh the page state so the brief reflects new results

Outreach generation is not run automatically for all contacts. Instead, the brief exposes fast entry points for the top 1-3 contacts after scoring is complete.

### Per-Section Reruns

Each section also supports its own action:

- rerun report generation
- rerun contact discovery
- rerun scoring for the company's current contacts
- rerun outreach generation for an individual recommended contact

Rerunning a section updates that section's result without hiding or deleting successful results from other sections.

## State Model

Each major section must expose one of four user-visible states:

- `empty`
- `running`
- `success`
- `error`

The page must also support mixed states. Example:

- research: success
- contacts: success
- scoring: error
- outreach: empty

The design requirement is that partial success remains visible. A failure in a later step must not wipe completed work from earlier steps.

### Global Action Rules

- `Generate Brief` is disabled while a full brief run is in progress
- section-level rerun buttons are disabled only for the section that is currently running
- reruns are allowed after success or error
- if a rerun updates a section, the UI should show a recent update indicator such as `Updated just now`

## Recommendation Logic

The scoring section must produce a simple ranked view of recommended contacts.

First-version ranking rules:

- prefer contacts with an existing lead score
- sort scored contacts by total score descending
- unscored contacts sort below scored contacts
- the outreach section uses the top 1-3 scored contacts by default

If no scored contacts exist, the outreach section stays in an empty state and prompts the user to run scoring first.

## Data Model Strategy

The first version does not introduce a new persisted `briefs` table.

The `Company Prospecting Brief` is a derived company-level view assembled from existing entities:

- `companies`
- `company_reports`
- `contacts`
- `lead_scores`

Reasoning:

- this reduces schema churn for the demo version
- it reuses existing service and repository boundaries
- it keeps the first version focused on workflow composition, not infrastructure expansion

Persisted message history is also out of scope. Outreach is generated on demand from the brief page.

## Server and API Design

### Aggregated Read Path

Add a server-side aggregated read path for the brief page that returns everything needed to render:

- company summary data
- report status and content
- company contacts
- scores for those contacts
- derived recommended contacts

This can be implemented as a dedicated action or a page-scoped loader, but it should provide one page-ready payload instead of forcing the page to orchestrate many independent fetches.

### Orchestration Route

Add a dedicated route for full brief generation, for example:

- `POST /api/briefs/generate`

This route should:

1. validate `companyId`
2. call the existing report generation service
3. call the existing contact discovery service
4. load contacts for the company
5. score each current contact
6. return a result summary for each step

The route should reuse existing business services rather than duplicate their logic.

### Existing Section Routes

The current step-specific routes remain valid:

- report generation route
- contact discovery route
- lead scoring route
- message generation route

These power section-level reruns and keep the system modular.

## UI Component Boundaries

Recommended component structure:

- `BriefPage`
- `BriefHeader`
- `ResearchSection`
- `ContactsSection`
- `ScoringSection`
- `OutreachSection`
- `BriefRunController`

Responsibilities:

- `BriefPage` owns page assembly and initial data loading
- `BriefHeader` owns top-level summary and primary action
- each section owns its own rendering states and rerun affordances
- `BriefRunController` owns the client-side sequence for full brief generation and section status updates

This separation keeps each file focused and makes it easier to test rendering and state behavior independently.

## Error Handling

The brief page must remain usable even when some operations fail.

### Required Behavior

- report failure does not block access to company context or previously generated report content
- contact discovery failure does not delete existing contacts
- scoring failure can return partial success if some contacts were scored and some failed
- message generation failure affects only the targeted contact card
- the page never collapses into a global fatal state because one section failed

### Error UX

Each section should surface:

- what failed
- whether any prior result still exists
- a clear retry action

Errors should be phrased in product language first, with technical detail optional and secondary.

## Testing Strategy

### 1. Aggregated Read Coverage

Test the brief read path for these states:

- no report, no contacts, no scores
- report exists, no contacts
- contacts exist, no scores
- report and contacts exist, partial scores exist
- complete brief data exists

### 2. Orchestration Route Coverage

Test:

- valid sequential execution
- invalid `companyId`
- report step failure
- contact discovery failure
- partial scoring failure across multiple contacts
- result summary shape for the client

### 3. UI State Coverage

Test rendering for:

- empty
- running
- success
- error

Test that:

- primary action disables during a full run
- section rerun actions map to the right section state
- partial success remains visible after a later failure

## Navigation Impact

Navigation should keep the existing dashboard, contacts, analytics, and settings structure, but the brief becomes the preferred destination for company-specific work.

Recommended first-version behavior:

- dashboard remains the company list
- selecting a company should lead naturally to the brief page
- contacts remains a broader lead management page
- analytics remains secondary to the main demo narrative

## Success Criteria

The feature is successful if a founder can do the following in one short session:

1. open a company
2. run or review the brief
3. understand which contacts matter most
4. understand why they matter
5. generate a message for a top contact

The demo should feel like one coherent workflow, not four unrelated tools.

## Resolved Decisions

- primary audience is founders and small teams
- demo target is a 10-minute value-forward walkthrough
- the main deliverable is one company-level brief containing report, contacts, scores, and outreach entry points
- interaction model is mixed: one-click generation plus per-section control
- no new persisted brief table in v1
- no background job system in v1
- no persisted outreach history in v1

## Open Design Boundary

This spec is intentionally limited to a single-company prospecting brief. If later work requires multi-company orchestration, run history, or team collaboration, those should be separate specs rather than extensions of this first implementation plan.

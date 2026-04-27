# Exa Search Integration Notes

This repository now handles external web research through Exa instead of relying on model-provider-specific live search features.

## Architecture

- Exa is the only external search layer.
- LLMs receive search results as prompt context or tool output.
- Model selection is centralized in `lib/ai/model.ts`.

## Current Flow

### Search-first flows

- `app/api/companies/auto-fill/route.ts`
  - Searches Exa for company data, then asks the configured model to extract structured fields.
- `app/api/contacts/auto-fill/route.ts`
  - Uses Exa Contents on the provided LinkedIn URL, then asks the configured model to extract structured fields.
- `lib/server/services/reports/generate-company-report.ts`
  - Pulls Exa company and news context before generating the report.
- `lib/server/services/contacts/find-contacts-for-company.ts`
  - Pulls Exa LinkedIn and company-site context before extracting contacts.
- `lib/server/services/leads/score-lead-for-contact.ts`
  - Optionally enriches lead scoring with Exa search context.

### Model configuration

- Default provider: `openai`
- Switch providers with:
  - `AI_MODEL_PROVIDER`
  - `AI_MODEL_ID`

The goal is to keep search independent from model choice so provider changes only affect `lib/ai/model.ts` and environment configuration.

## Environment

- Required for external search: `EXA_API_KEY`
- Required when using OpenAI as the model provider: `OPENAI_API_KEY`

# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** Required env vars, external API keys/services, dependency quirks, platform-specific notes.
**What does NOT belong here:** Service ports/commands (use `.factory/services.yaml`).

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `DATABASE_MIGRATIONS_URL` | No | Separate connection for migrations (when DATABASE_URL points at a pooler) |
| `EXA_API_KEY` | Yes (for search) | Exa API key for web search |
| `XAI_API_KEY` | Yes (default provider) | xAI API key for LLM |
| `OPENAI_API_KEY` | No | Only needed when using OpenAI as provider |
| `AI_MODEL_PROVIDER` | No | "xai" (default) or "openai" |
| `AI_MODEL_ID` | No | Override default model ID |

## External Dependencies

- **Postgres** — Cloud-hosted database, connection via DATABASE_URL
- **Exa API** — Web search provider used for company research, contact discovery, lead scoring enrichment
- **xAI/Grok** — Default LLM provider for structured generation and streaming
- **OpenAI** — Alternative LLM provider (opt-in via env vars)

## Notes

- The `.env` file is gitignored
- `@t3-oss/env-nextjs` validates env vars at build time via `lib/env.mjs`
- Auto-migration runs on `pnpm dev` start (may fail if DATABASE_URL is not set)

# Repository Configuration Notes

This document is the tracked source of truth for repository-level setup details.

## Environment Variables

- `.env` is local-only and is gitignored.
- Use `.env.example` as the template for required keys.
- Required keys:
  - `DATABASE_URL`
  - `DATABASE_MIGRATIONS_URL` (optional but recommended for migrations)
  - `OPENAI_API_KEY`
  - `EXA_API_KEY`
- Optional keys:
  - `XAI_API_KEY`
  - `AI_MODEL_PROVIDER`
  - `AI_MODEL_ID`

## Build and Type Safety

- Production builds run TypeScript checks.
- Validation commands:
  - `pnpm exec tsc --noEmit`
  - `pnpm lint`
  - `pnpm format:check`
  - `pnpm build`

## Notes on Ignored Docs

- This repository intentionally ignores `README.md` and `CLAUDE.md`.
- Keep shared, versioned project notes under `docs/`.

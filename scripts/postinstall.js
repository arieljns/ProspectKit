/* eslint-disable no-console */
const { spawnSync } = require("node:child_process");

const truthy = (value) => value === "1" || value === "true" || value === "TRUE";

const isVercel = truthy(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV);
const isCI = truthy(process.env.CI);

const databaseUrl = process.env.DATABASE_URL;
const skipMigrations = truthy(process.env.SKIP_DB_MIGRATIONS);
const forceMigrations = truthy(process.env.RUN_DB_MIGRATIONS);

if (skipMigrations) {
  console.log("⏭️  Skipping DB migrations (SKIP_DB_MIGRATIONS=1).");
  process.exit(0);
}

// Vercel runs `postinstall` during `pnpm install`. Running DB migrations there is
// brittle (env may be missing/misconfigured; DB may be unreachable).
if ((isVercel || isCI) && !forceMigrations) {
  console.log(
    "⏭️  Skipping DB migrations during install on Vercel/CI. Set RUN_DB_MIGRATIONS=1 to force."
  );
  process.exit(0);
}

if (!databaseUrl && !forceMigrations) {
  console.log("⏭️  Skipping DB migrations (DATABASE_URL not set).");
  process.exit(0);
}

const execPath = process.env.npm_execpath;
const args = execPath ? [execPath, "run", "db:auto-migrate"] : ["run", "db:auto-migrate"];

const result = spawnSync("node", args, { stdio: "inherit", env: process.env });

if (result.status === 0) process.exit(0);

if (!forceMigrations) {
  console.log(
    "⚠️  DB migration failed during postinstall; continuing. Set RUN_DB_MIGRATIONS=1 to make this fatal."
  );
  process.exit(0);
}

process.exit(result.status ?? 1);


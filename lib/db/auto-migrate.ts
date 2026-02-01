import { env } from "@/lib/env.mjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Auto-migration script that runs silently before dev server starts
 * This ensures the database is always up-to-date without manual intervention
 */
export const autoMigrate = async () => {
  if (!env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined");
    process.exit(1);
  }

  try {
    const connection = postgres(env.DATABASE_URL, { max: 1 });
    const db = drizzle(connection);

    console.log("🔄 Checking for pending migrations...");

    const start = Date.now();
    await migrate(db, { migrationsFolder: 'lib/db/migrations' });
    const end = Date.now();

    console.log(`✅ Database is up-to-date (${end - start}ms)`);

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:");
    console.error(err);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  autoMigrate();
}

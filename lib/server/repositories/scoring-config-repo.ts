import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  scoringConfig,
  type UpdateScoringConfigParams,
} from "@/lib/db/schema/scoring-config";

export async function findDefaultScoringConfig() {
  const [config] = await db
    .select()
    .from(scoringConfig)
    .where(eq(scoringConfig.id, "default"))
    .limit(1);

  return config ?? null;
}

export async function getOrCreateDefaultScoringConfig(
  defaultConfig: UpdateScoringConfigParams,
) {
  const config = await findDefaultScoringConfig();
  if (config) {
    return config;
  }

  const [createdConfig] = await db
    .insert(scoringConfig)
    .values({
      id: "default",
      ...defaultConfig,
    })
    .returning();

  return createdConfig ?? null;
}

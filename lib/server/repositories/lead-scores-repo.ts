import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  leadScores,
  type NewLeadScoreParams,
} from "@/lib/db/schema/lead-scores";

export async function findLeadScoreByContactId(contactId: string) {
  const [score] = await db
    .select()
    .from(leadScores)
    .where(eq(leadScores.contactId, contactId))
    .limit(1);

  return score ?? null;
}

export async function findLeadScoresByContactIds(contactIds: string[]) {
  if (contactIds.length === 0) {
    return [];
  }

  const scores = await db
    .select()
    .from(leadScores)
    .where(inArray(leadScores.contactId, contactIds));

  return scores;
}

export async function upsertLeadScore(input: NewLeadScoreParams) {
  const [savedScore] = await db
    .insert(leadScores)
    .values(input)
    .onConflictDoUpdate({
      target: leadScores.contactId,
      set: {
        ...input,
        updatedAt: new Date(),
      },
    })
    .returning();

  return savedScore ?? null;
}

import "server-only";

import { db } from "@/lib/db";
import { resources } from "@/lib/db/schema/resources";
import { embeddings } from "@/lib/db/schema/embeddings";

export async function createResourceRecord(content: string) {
  const [resource] = await db.insert(resources).values({ content }).returning();
  return resource ?? null;
}

export async function createEmbeddingsForResource(
  resourceId: string,
  chunks: Array<{ embedding: number[]; content: string }>,
) {
  if (chunks.length === 0) {
    return;
  }

  await db.insert(embeddings).values(
    chunks.map((chunk) => ({
      resourceId,
      ...chunk,
    })),
  );
}

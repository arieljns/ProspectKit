import "server-only";

import {
  type NewResourceParams,
  insertResourceSchema,
} from "@/lib/db/schema/resources";
import { generateEmbeddings } from "@/lib/ai/embedding";
import {
  createEmbeddingsForResource,
  createResourceRecord,
} from "@/lib/server/repositories/resources-repo";

export async function createResource(input: NewResourceParams) {
  try {
    const { content } = insertResourceSchema.parse(input);

    const resource = await createResourceRecord(content);
    if (!resource) {
      return "Failed to create resource.";
    }

    const embeddings = await generateEmbeddings(content);
    await createEmbeddingsForResource(resource.id, embeddings);

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
}

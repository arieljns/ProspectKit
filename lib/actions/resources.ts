"use server";

import { type NewResourceParams } from "@/lib/db/schema/resources";
import { createResource as createResourceService } from "@/lib/server/services/resources/create-resource";

export const createResource = async (input: NewResourceParams) => {
  return createResourceService(input);
};

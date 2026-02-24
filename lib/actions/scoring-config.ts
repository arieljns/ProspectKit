"use server";

import { db } from "../db";
import {
  scoringConfig,
  updateScoringConfigSchema,
  type UpdateScoringConfigParams,
} from "../db/schema/scoring-config";
import { revalidatePath } from "next/cache";
import { DEFAULT_SCORING_CONFIG } from "@/lib/server/domain/default-scoring-config";
import { getOrCreateDefaultScoringConfig } from "@/lib/server/repositories/scoring-config-repo";

/**
 * Default scoring configuration
 * Used for initial setup and reset
 */
/**
 * Get the current scoring configuration
 * Creates default config if none exists
 */
export const getScoringConfig = async () => {
  try {
    const config = await getOrCreateDefaultScoringConfig(
      DEFAULT_SCORING_CONFIG,
    );

    if (!config) {
      return { success: false, error: "Failed to fetch config" };
    }

    return { success: true, data: config };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch config",
    };
  }
};

/**
 * Update scoring configuration
 */
export const updateScoringConfig = async (input: UpdateScoringConfigParams) => {
  try {
    // Validate input
    const validatedData = updateScoringConfigSchema.parse(input);

    // Validate weights sum to 100
    const totalWeight = Object.values(validatedData.weights).reduce(
      (sum, weight) => sum + weight,
      0,
    );

    if (totalWeight !== 100) {
      return {
        success: false,
        error: `Weights must sum to 100. Current sum: ${totalWeight}`,
      };
    }

    // Update or insert
    const [updatedConfig] = await db
      .insert(scoringConfig)
      .values({
        id: "default",
        ...validatedData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: scoringConfig.id,
        set: {
          ...validatedData,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath("/app/settings/scoring");
    revalidatePath("/app/contacts");

    return { success: true, data: updatedConfig };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update config",
    };
  }
};

/**
 * Reset configuration to default values
 */
export const resetScoringConfig = async () => {
  try {
    const [resetConfig] = await db
      .insert(scoringConfig)
      .values({
        id: "default",
        ...DEFAULT_SCORING_CONFIG,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: scoringConfig.id,
        set: {
          ...DEFAULT_SCORING_CONFIG,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath("/app/settings/scoring");
    revalidatePath("/app/contacts");

    return { success: true, data: resetConfig };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset config",
    };
  }
};

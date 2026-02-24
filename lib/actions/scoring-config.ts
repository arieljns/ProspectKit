'use server';

import { db } from '../db';
import {
  scoringConfig,
  updateScoringConfigSchema,
  type UpdateScoringConfigParams,
} from '../db/schema/scoring-config';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Default scoring configuration
 * Used for initial setup and reset
 */
const DEFAULT_CONFIG: UpdateScoringConfigParams = {
  userCompanyName: 'ProspectKit',
  userCompanyDescription:
    'An open-source outbound workspace built for small teams.',
  productDescription:
    'ProspectKit helps teams run a lean outbound workflow: company research, contact discovery, lead scoring, and outreach drafting.',
  targetIndustries: ['SaaS', 'Developer Tools', 'AI/ML', 'FinTech'],
  targetSeniorityLevels: ['C-level', 'VP', 'Director'],
  weights: {
    industryMatch: 25,
    companyMatch: 30,
    positionMatch: 20,
    seniorityMatch: 15,
    dealSizeMatch: 10,
  },
};

/**
 * Get the current scoring configuration
 * Creates default config if none exists
 */
export const getScoringConfig = async () => {
  try {
    const [config] = await db
      .select()
      .from(scoringConfig)
      .where(eq(scoringConfig.id, 'default'))
      .limit(1);

    // If no config exists, create default
    if (!config) {
      const [newConfig] = await db
        .insert(scoringConfig)
        .values({
          id: 'default',
          ...DEFAULT_CONFIG,
        })
        .returning();

      return { success: true, data: newConfig };
    }

    return { success: true, data: config };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch config',
    };
  }
};

/**
 * Update scoring configuration
 */
export const updateScoringConfig = async (
  input: UpdateScoringConfigParams
) => {
  try {
    // Validate input
    const validatedData = updateScoringConfigSchema.parse(input);

    // Validate weights sum to 100
    const totalWeight = Object.values(validatedData.weights).reduce(
      (sum, weight) => sum + weight,
      0
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
        id: 'default',
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

    revalidatePath('/app/settings/scoring');
    revalidatePath('/app/contacts');

    return { success: true, data: updatedConfig };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update config',
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
        id: 'default',
        ...DEFAULT_CONFIG,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: scoringConfig.id,
        set: {
          ...DEFAULT_CONFIG,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath('/app/settings/scoring');
    revalidatePath('/app/contacts');

    return { success: true, data: resetConfig };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset config',
    };
  }
};

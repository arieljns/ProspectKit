'use server';

import { db } from '../db';
import {
  leadScores,
  insertLeadScoreSchema,
  type NewLeadScoreParams,
} from '../db/schema/lead-scores';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get lead score for a specific contact
 */
export const getLeadScore = async (contactId: string) => {
  try {
    const [score] = await db
      .select()
      .from(leadScores)
      .where(eq(leadScores.contactId, contactId))
      .limit(1);

    if (!score) {
      return { success: true, data: null };
    }

    return { success: true, data: score };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch score',
    };
  }
};

/**
 * Save or update lead score
 * If score exists for this contact, update it
 * Otherwise, create new score
 */
export const saveLeadScore = async (input: NewLeadScoreParams) => {
  try {
    // Validate input
    const validatedData = insertLeadScoreSchema.parse(input);

    // Validate scores are in range 0-100
    const scores = [
      validatedData.industryMatchScore,
      validatedData.companyMatchScore,
      validatedData.positionMatchScore,
      validatedData.seniorityMatchScore,
      validatedData.dealSizeScore,
    ];

    for (const score of scores) {
      if (score < 0 || score > 100) {
        return {
          success: false,
          error: `All scores must be between 0 and 100. Got: ${score}`,
        };
      }
    }

    // Insert or update (upsert based on contactId unique constraint)
    const [savedScore] = await db
      .insert(leadScores)
      .values(validatedData)
      .onConflictDoUpdate({
        target: leadScores.contactId,
        set: {
          ...validatedData,
          updatedAt: new Date(),
        },
      })
      .returning();

    revalidatePath('/contacts');

    return { success: true, data: savedScore };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save score',
    };
  }
};

/**
 * Delete lead score for a contact
 */
export const deleteLeadScore = async (contactId: string) => {
  try {
    const [deletedScore] = await db
      .delete(leadScores)
      .where(eq(leadScores.contactId, contactId))
      .returning();

    if (!deletedScore) {
      return { success: false, error: 'Score not found' };
    }

    revalidatePath('/contacts');

    return { success: true, message: 'Score deleted' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete score',
    };
  }
};

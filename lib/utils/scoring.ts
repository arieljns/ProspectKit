/**
 * Utility functions for lead scoring calculations
 * Used on the frontend to calculate total scores and grades
 */

/**
 * Default scoring weights used when no scoring config is available.
 * These must sum to 100.
 */
export const DEFAULT_WEIGHTS = {
  industryMatch: 25,
  companyMatch: 30,
  positionMatch: 20,
  seniorityMatch: 15,
  dealSizeMatch: 10,
};

/**
 * Calculate weighted total score from dimension scores
 */
export function calculateTotalScore(
  dimensionScores: {
    industryMatchScore: number;
    companyMatchScore: number;
    positionMatchScore: number;
    seniorityMatchScore: number;
    dealSizeScore: number;
  },
  weights: {
    industryMatch: number;
    companyMatch: number;
    positionMatch: number;
    seniorityMatch: number;
    dealSizeMatch: number;
  },
): number {
  const total =
    dimensionScores.industryMatchScore * (weights.industryMatch / 100) +
    dimensionScores.companyMatchScore * (weights.companyMatch / 100) +
    dimensionScores.positionMatchScore * (weights.positionMatch / 100) +
    dimensionScores.seniorityMatchScore * (weights.seniorityMatch / 100) +
    dimensionScores.dealSizeScore * (weights.dealSizeMatch / 100);

  return Math.round(total);
}

/**
 * Get letter grade based on total score
 */
export function getScoreGrade(totalScore: number): "A" | "B" | "C" {
  if (totalScore >= 85) return "A";
  if (totalScore >= 70) return "B";
  return "C";
}

/**
 * Get badge color variant based on grade
 */
export function getGradeBadgeVariant(
  grade: "A" | "B" | "C",
): "default" | "secondary" | "outline-solid" {
  switch (grade) {
    case "A":
      return "default"; // Green/primary color
    case "B":
      return "secondary"; // Yellow/warning color
    case "C":
      return "outline-solid"; // Gray/muted color
  }
}

/**
 * Validate that weights sum to 100
 */
export function validateWeights(weights: {
  industryMatch: number;
  companyMatch: number;
  positionMatch: number;
  seniorityMatch: number;
  dealSizeMatch: number;
}): { valid: boolean; total: number } {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return {
    valid: total === 100,
    total,
  };
}

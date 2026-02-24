import type { UpdateScoringConfigParams } from "@/lib/db/schema/scoring-config";

export const DEFAULT_SCORING_CONFIG: UpdateScoringConfigParams = {
  userCompanyName: "ProspectKit",
  userCompanyDescription:
    "An open-source outbound workspace built for small teams.",
  productDescription:
    "ProspectKit helps teams run a lean outbound workflow: company research, contact discovery, lead scoring, and outreach drafting.",
  targetIndustries: ["SaaS", "Developer Tools", "AI/ML", "FinTech"],
  targetSeniorityLevels: ["C-level", "VP", "Director"],
  weights: {
    industryMatch: 25,
    companyMatch: 30,
    positionMatch: 20,
    seniorityMatch: 15,
    dealSizeMatch: 10,
  },
};

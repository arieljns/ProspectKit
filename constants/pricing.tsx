import { landingPricingTiers } from "@/lib/marketing/landing-content";

export enum TierName {
  TIER_1 = "Starter",
  TIER_2 = "Sponsor",
  TIER_3 = "Partner",
}

export const tiers = landingPricingTiers.map((tier) => ({
  ...tier,
  title: tier.title as TierName,
}));

export const pricingTable = [
  {
    title: "Seats included",
    tiers: [
      { title: TierName.TIER_1, value: "Up to 3" },
      { title: TierName.TIER_2, value: "Up to 10" },
      { title: TierName.TIER_3, value: "Custom" },
    ],
  },
  {
    title: "Lead scoring configuration",
    tiers: [
      { title: TierName.TIER_1, value: "Basic" },
      { title: TierName.TIER_2, value: "Advanced" },
      { title: TierName.TIER_3, value: "Advanced+" },
    ],
  },
  {
    title: "Outreach drafting",
    tiers: [
      { title: TierName.TIER_1, value: "Included" },
      { title: TierName.TIER_2, value: "Included" },
      { title: TierName.TIER_3, value: "Included" },
    ],
  },
  {
    title: "Support channel",
    tiers: [
      { title: TierName.TIER_1, value: "Community" },
      { title: TierName.TIER_2, value: "Priority" },
      { title: TierName.TIER_3, value: "Direct" },
    ],
  },
  {
    title: "Deployment model",
    tiers: [
      { title: TierName.TIER_1, value: "Self-hosted" },
      { title: TierName.TIER_2, value: "Self-hosted" },
      { title: TierName.TIER_3, value: "Guided setup" },
    ],
  },
];

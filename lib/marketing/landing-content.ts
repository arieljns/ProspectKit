import {
  PROSPECTKIT_CONTACT_MAILTO,
  PROSPECTKIT_REPO_URL,
  PROSPECTKIT_SPONSOR_URL,
} from "@/lib/marketing/links";

export type LandingNavItem = {
  title: string;
  href: string;
};

export type PricingTier = {
  title: string;
  subtitle: string;
  monthly: number;
  yearly: number;
  ctaText: string;
  ctaLink: string;
  featured?: boolean;
  features: string[];
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type TestimonialItem = {
  src: string;
  logoClassName: string;
  sideText: string;
  sideSubText: string;
  quote: string;
  name: string;
  position: string;
  company: string;
  avatar: string;
};

export type FeatureCard = {
  title: string;
  description: string;
};

export type WorkflowStep = {
  title: string;
  description: string;
};

export type WorkflowOutcome = {
  metric: string;
  title: string;
  description: string;
};

export type BoundaryPoint = {
  title: string;
  description: string;
};

export const landingNavItems: LandingNavItem[] = [
  { title: "Workflow", href: "#how-it-works" },
  { title: "Core features", href: "#core-features" },
  { title: "Benefits", href: "#benefits" },
  { title: "Outcomes", href: "#outcomes" },
  { title: "Boundaries", href: "#boundaries" },
  { title: "FAQ", href: "#faq" },
];

export const landingLogos = [
  {
    title: "Logo 1",
    src: "/marketing/logos/logo_1.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
  {
    title: "Logo 2",
    src: "/marketing/logos/logo_2.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
  {
    title: "Logo 3",
    src: "/marketing/logos/logo_3.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
  {
    title: "Logo 4",
    src: "/marketing/logos/logo_4.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
  {
    title: "Logo 5",
    src: "/marketing/logos/logo_5.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
  {
    title: "Logo 6",
    src: "/marketing/logos/logo_6.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
  {
    title: "Logo 7",
    src: "/marketing/logos/logo_7.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
  {
    title: "Logo 8",
    src: "/marketing/logos/logo_8.png",
    className: "h-auto w-36 max-w-[70%] rounded-sm sm:w-40 md:w-44",
  },
];

export const coreFeatureCards: FeatureCard[] = [
  {
    title: "Manage leads workspace",
    description:
      "Run contact context, score details, status updates, and outreach drafting from one screen.",
  },
  {
    title: "Company research reports",
    description:
      "Generate structured account reports with strengths, challenges, products, and market insights.",
  },
  {
    title: "Contact discovery and enrich",
    description:
      "Find key stakeholders and enrich contact records with role and company context.",
  },
  {
    title: "Outreach message drafting",
    description:
      "Create ready-to-edit connection requests or email drafts with contextual reasoning.",
  },
  {
    title: "Configurable lead scoring",
    description:
      "Adjust target industries, seniority, and scoring weights to match your motion.",
  },
  {
    title: "Pipeline analytics snapshot",
    description:
      "See funnel movement, contacted coverage, and qualification progress at a glance.",
  },
];

export const landingBenefitCards: FeatureCard[] = [
  {
    title: "Faster outbound setup",
    description: "Launch a usable SDR workflow in days, not months.",
  },
  {
    title: "Less context switching",
    description:
      "Keep research, qualification, and drafting in one operating surface.",
  },
  {
    title: "More consistent prioritization",
    description:
      "Use shared scoring logic so the team works the same leads first.",
  },
  {
    title: "Higher outreach throughput",
    description:
      "Generate first drafts faster while keeping personalization quality.",
  },
  {
    title: "Clearer pipeline signal",
    description:
      "Track lead status and qualification trends without heavyweight BI setup.",
  },
  {
    title: "Open-source control",
    description:
      "Own the stack and evolve the workflow as your motion changes.",
  },
];

export const workflowOutcomes: WorkflowOutcome[] = [
  {
    metric: "1 workspace",
    title: "From account list to first draft",
    description:
      "Replace handoffs across scattered tools with one continuous flow.",
  },
  {
    metric: "5 dimensions",
    title: "Shared qualification language",
    description:
      "Score leads with transparent criteria that the whole team understands.",
  },
  {
    metric: "Context-first",
    title: "Better research before outreach",
    description:
      "Ground each message in account and contact context before writing.",
  },
  {
    metric: "Lean by design",
    title: "Built for teams under five",
    description:
      "Keep only the essential SDR loop without enterprise operational overhead.",
  },
];

export const prospectKitDoes: BoundaryPoint[] = [
  {
    title: "Lead discovery and enrichment",
    description: "Find companies, research accounts, and capture key contacts.",
  },
  {
    title: "Qualification and prioritization",
    description: "Score leads with configurable ICP criteria and weighting.",
  },
  {
    title: "Outreach content support",
    description:
      "Generate context-aware draft messages that reps can edit and send.",
  },
  {
    title: "Pipeline signal visibility",
    description:
      "Track lead statuses, conversion stages, and score distribution.",
  },
];

export const prospectKitDoesNot: BoundaryPoint[] = [
  {
    title: "Not a CRM replacement",
    description: "ProspectKit does not try to replace full CRM systems.",
  },
  {
    title: "Not an outbound sender",
    description: "It does not send emails or LinkedIn messages on your behalf.",
  },
  {
    title: "Not a sequence orchestrator",
    description: "It does not provide multistep sequence automation.",
  },
];

export const landingPricingTiers: PricingTier[] = [
  {
    title: "Starter",
    subtitle: "Early-stage teams",
    monthly: 0,
    yearly: 0,
    ctaText: "Use the demo",
    ctaLink: "/app",
    features: [
      "Self-hosted open-source setup",
      "Core lead list workflow",
      "Contact and company records",
      "Basic lead scoring controls",
      "Outreach draft generation",
    ],
  },
  {
    title: "Sponsor",
    subtitle: "Support ongoing development",
    monthly: 12,
    yearly: 120,
    ctaText: "Sponsor on GitHub",
    ctaLink: PROSPECTKIT_SPONSOR_URL,
    featured: true,
    features: [
      "Everything in Starter",
      "Priority issue triage",
      "Community roadmap input",
      "Early release previews",
      "Sustained maintenance support",
    ],
  },
  {
    title: "Partner",
    subtitle: "Hands-on support",
    monthly: 49,
    yearly: 490,
    ctaText: "Contact us",
    ctaLink: PROSPECTKIT_CONTACT_MAILTO,
    features: [
      "Everything in Sponsor",
      "Implementation guidance",
      "Custom workflow consultation",
      "Team onboarding support",
      "Direct async support channel",
    ],
  },
];

export const landingFaqs: FAQItem[] = [
  {
    question: "Who is ProspectKit built for?",
    answer:
      "ProspectKit is designed for small teams and early-stage startups, especially sales teams with fewer than five people.",
  },
  {
    question: "What is the main value of ProspectKit?",
    answer:
      "It helps tiny teams complete the essential SDR loop in one place: find accounts, research, qualify, draft outreach, and monitor pipeline signal.",
  },
  {
    question: "How is this different from heavier platforms?",
    answer:
      "ProspectKit intentionally focuses on the core outbound workflow instead of broad all-in-one sales automation.",
  },
  {
    question: "Can we self-host and customize it?",
    answer:
      "Yes. The project is open-source, so you can self-host, modify flows, and tailor it to your own process.",
  },
  {
    question: "Does it support configurable lead scoring?",
    answer:
      "Yes. You can configure target industries, seniority levels, and scoring weights across five qualification dimensions.",
  },
  {
    question: "What is explicitly out of scope?",
    answer:
      "ProspectKit does not aim to be a CRM, outbound sender, sequence tool, or data broker. It focuses on pre-send prospecting and qualification workflow.",
  },
  {
    question: "Where can we contribute?",
    answer:
      "You can open issues, submit pull requests, or sponsor the project to help accelerate development.",
  },
];

export const landingTestimonials: TestimonialItem[] = [
  {
    src: "/marketing/logos/logo_1.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "2x",
    sideSubText: "Faster list building",
    quote:
      "We replaced a patchwork of spreadsheets and tools with one workflow our tiny team can actually maintain.",
    name: "Ari Patel",
    position: "Founder",
    company: "Northline",
    avatar: "/marketing/team/1.png",
  },
  {
    src: "/marketing/logos/logo_2.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "40%",
    sideSubText: "Less tool switching",
    quote:
      "The biggest win is focus. Reps spend more time contacting good leads and less time managing tabs.",
    name: "Maya Chen",
    position: "Sales Lead",
    company: "SignalWorks",
    avatar: "/marketing/team/2.png",
  },
  {
    src: "/marketing/logos/logo_3.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "3 weeks",
    sideSubText: "To first pipeline",
    quote:
      "As an early-stage team, we needed practical structure quickly. ProspectKit gave us a usable outbound engine fast.",
    name: "Noah Rivera",
    position: "Co-founder",
    company: "Telescope",
    avatar: "/marketing/team/3.png",
  },
  {
    src: "/marketing/logos/logo_4.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "100%",
    sideSubText: "Open-source stack",
    quote:
      "Having full control over the codebase made it easier to adapt the workflow to our exact sales motion.",
    name: "Lina Brooks",
    position: "Ops Manager",
    company: "LedgerPeak",
    avatar: "/marketing/team/4.png",
  },
  {
    src: "/marketing/logos/logo_5.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "5 reps",
    sideSubText: "Single shared workflow",
    quote:
      "With a small sales team, consistency matters. The structure here kept messaging and qualification aligned.",
    name: "Ethan Cole",
    position: "Head of Growth",
    company: "Draftline",
    avatar: "/marketing/team/5.png",
  },
  {
    src: "/marketing/logos/logo_6.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "1 place",
    sideSubText: "For SDR execution",
    quote:
      "Lead research, scoring, and outreach finally live together, which removed a lot of operational friction.",
    name: "Sofia Kim",
    position: "Revenue Ops",
    company: "Waypoint",
    avatar: "/marketing/team/6.png",
  },
  {
    src: "/marketing/logos/logo_7.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "10 hrs",
    sideSubText: "Saved weekly",
    quote:
      "The lightweight approach is exactly what we wanted. No bloated setup, just essentials done well.",
    name: "Ryan Scott",
    position: "Founder",
    company: "Belltree",
    avatar: "/marketing/team/1.png",
  },
  {
    src: "/marketing/logos/logo_8.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "Faster",
    sideSubText: "Outbound iteration",
    quote:
      "We can quickly test segments and message variants without rebuilding process every sprint.",
    name: "Emma Diaz",
    position: "Sales Manager",
    company: "Crestline",
    avatar: "/marketing/team/2.png",
  },
  {
    src: "/marketing/logos/logo_1.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "Lean",
    sideSubText: "By design",
    quote:
      "ProspectKit is intentionally focused, which is why it works well for early teams with tight bandwidth.",
    name: "Leo Park",
    position: "Growth Lead",
    company: "April Labs",
    avatar: "/marketing/team/3.png",
  },
  {
    src: "/marketing/logos/logo_2.png",
    logoClassName: "h-auto w-36 max-w-full rounded-sm",
    sideText: "OSS",
    sideSubText: "Community-backed",
    quote:
      "We appreciate that it is open-source and evolving with real feedback from startup operators.",
    name: "Nina Ross",
    position: "Co-founder",
    company: "Sable",
    avatar: "/marketing/team/4.png",
  },
];

export const landingLinks = {
  primaryCta: "/app",
  repo: PROSPECTKIT_REPO_URL,
  sponsor: PROSPECTKIT_SPONSOR_URL,
  contact: PROSPECTKIT_CONTACT_MAILTO,
};

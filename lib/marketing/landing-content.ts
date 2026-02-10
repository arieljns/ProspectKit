import {
  ORBIT_CONTACT_MAILTO,
  ORBIT_REPO_URL,
  ORBIT_SPONSOR_URL,
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

export type UseCase = {
  title: string;
  description: string;
};

export const landingNavItems: LandingNavItem[] = [
  { title: "Features", href: "#core-features" },
  { title: "How it works", href: "#how-it-works" },
  { title: "Use cases", href: "#use-cases" },
  { title: "Pricing", href: "#pricing" },
  { title: "FAQ", href: "#faq" },
];

export const landingLogos = [
  { title: "Logo 1", src: "/marketing/logos/1.png", className: "h-10 w-auto" },
  { title: "Logo 2", src: "/marketing/logos/2.png", className: "h-6 w-auto" },
  { title: "Logo 3", src: "/marketing/logos/3.png", className: "h-6 w-auto" },
  { title: "Logo 4", src: "/marketing/logos/4.png", className: "h-8 w-auto" },
  { title: "Logo 5", src: "/marketing/logos/5.png", className: "h-8 w-auto" },
  { title: "Logo 6", src: "/marketing/logos/6.png", className: "h-10 w-auto" },
  { title: "Logo 7", src: "/marketing/logos/7.png", className: "h-10 w-auto" },
  { title: "Logo 8", src: "/marketing/logos/8.png", className: "h-10 w-auto" },
  { title: "Logo 9", src: "/marketing/logos/9.png", className: "h-6 w-auto" },
  {
    title: "Logo 10",
    src: "/marketing/logos/10.png",
    className: "h-10 w-auto",
  },
];

export const howItWorksSteps: FeatureCard[] = [
  {
    title: "Build lead lists",
    description:
      "Collect target companies and contacts in one lightweight workspace for your SDR team.",
  },
  {
    title: "Enrich and score",
    description:
      "Prioritize outreach with configurable scoring and fast context pulled into one screen.",
  },
  {
    title: "Launch outreach",
    description:
      "Draft and send personalized messages, then track what moves leads forward.",
  },
];

export const coreFeatureCards: FeatureCard[] = [
  {
    title: "Company research snapshots",
    description:
      "Quickly capture key firmographic and market details for each target account.",
  },
  {
    title: "Contact discovery",
    description:
      "Find decision-makers and keep clean contact records without juggling multiple tools.",
  },
  {
    title: "Lead scoring controls",
    description:
      "Tune ICP signals and weights so small teams can focus on high-fit opportunities.",
  },
  {
    title: "Outreach drafting",
    description:
      "Generate ready-to-edit outbound messages using profile and company context.",
  },
  {
    title: "Pipeline status views",
    description:
      "Understand where prospects are stalling with simple funnel visibility.",
  },
  {
    title: "Open-source foundation",
    description:
      "Self-host, customize, and extend the workflow for your own operating style.",
  },
];

export const landingUseCases: UseCase[] = [
  {
    title: "Founder-led sales",
    description:
      "Run lean outbound from a single place when your team is still under five people.",
  },
  {
    title: "First SDR hire",
    description:
      "Give new reps a focused system for list building, qualification, and outreach.",
  },
  {
    title: "Pilot campaigns",
    description:
      "Test new segments quickly and compare response quality without heavy setup.",
  },
  {
    title: "Agency workflows",
    description:
      "Manage multiple client prospecting streams with shared templates and process.",
  },
  {
    title: "PLG assist motion",
    description:
      "Prioritize high-intent signups with scoring and contextual outbound follow-up.",
  },
  {
    title: "Community projects",
    description:
      "Use and improve the open-source stack for custom SDR experiments.",
  },
];

export const landingBenefitCards: FeatureCard[] = [
  {
    title: "Faster setup",
    description: "Get a practical outbound system running in days instead of weeks.",
  },
  {
    title: "Lower tool sprawl",
    description: "Replace fragmented workflows with one focused SDR surface.",
  },
  {
    title: "Clear prioritization",
    description: "Align team effort around leads with the strongest fit and intent.",
  },
  {
    title: "Repeatable outreach",
    description: "Standardize message quality while keeping personalization intact.",
  },
  {
    title: "Team visibility",
    description: "Track pipeline movement and handoffs without extra reporting overhead.",
  },
  {
    title: "Community leverage",
    description: "Ship improvements faster by building on an open-source codebase.",
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
    ctaLink: ORBIT_SPONSOR_URL,
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
    ctaLink: ORBIT_CONTACT_MAILTO,
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
    question: "Who is Orbit SDR built for?",
    answer:
      "Orbit SDR is designed for small teams and early-stage startups, especially sales teams with fewer than five people.",
  },
  {
    question: "How is this different from heavier platforms?",
    answer:
      "It focuses on essential lead-generation and outreach workflows instead of broad, complex automation suites.",
  },
  {
    question: "Can we self-host and customize it?",
    answer:
      "Yes. The project is open-source, so you can self-host, modify flows, and tailor it to your own process.",
  },
  {
    question: "Does it support lead scoring?",
    answer:
      "Yes. You can define score inputs and weighting rules to fit your ICP and prioritization strategy.",
  },
  {
    question: "Where can we contribute?",
    answer:
      "You can open issues, submit pull requests, or sponsor the project to help accelerate development.",
  },
];

export const landingTestimonials: TestimonialItem[] = [
  {
    src: "/marketing/logos/1.png",
    logoClassName: "h-10 w-auto",
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
    src: "/marketing/logos/2.png",
    logoClassName: "h-6 w-auto",
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
    src: "/marketing/logos/3.png",
    logoClassName: "h-6 w-auto",
    sideText: "3 weeks",
    sideSubText: "To first pipeline",
    quote:
      "As an early-stage team, we needed practical structure quickly. Orbit gave us a usable outbound engine fast.",
    name: "Noah Rivera",
    position: "Co-founder",
    company: "Telescope",
    avatar: "/marketing/team/3.png",
  },
  {
    src: "/marketing/logos/4.png",
    logoClassName: "h-8 w-auto",
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
    src: "/marketing/logos/5.png",
    logoClassName: "h-8 w-auto",
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
    src: "/marketing/logos/6.png",
    logoClassName: "h-10 w-auto",
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
    src: "/marketing/logos/7.png",
    logoClassName: "h-10 w-auto",
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
    src: "/marketing/logos/8.png",
    logoClassName: "h-10 w-auto",
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
    src: "/marketing/logos/9.png",
    logoClassName: "h-6 w-auto",
    sideText: "Lean",
    sideSubText: "By design",
    quote:
      "Orbit is intentionally focused, which is why it works well for early teams with tight bandwidth.",
    name: "Leo Park",
    position: "Growth Lead",
    company: "April Labs",
    avatar: "/marketing/team/3.png",
  },
  {
    src: "/marketing/logos/10.png",
    logoClassName: "h-10 w-auto",
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
  repo: ORBIT_REPO_URL,
  sponsor: ORBIT_SPONSOR_URL,
  contact: ORBIT_CONTACT_MAILTO,
};

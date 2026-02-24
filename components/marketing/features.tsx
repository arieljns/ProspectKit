import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";

const features = [
  {
    title: "Company research & enrichment",
    description:
      "Build a clean company record with website, industry, and key context from public signals.",
  },
  {
    title: "Contact discovery",
    description:
      "Find decision-makers and keep a lightweight lead list without switching tools.",
  },
  {
    title: "Configurable lead scoring",
    description:
      "Define your ICP and weighting, then score leads with transparent reasoning.",
  },
  {
    title: "Research reports",
    description:
      "Generate structured company briefs you can reuse across outreach and handoffs.",
  },
  {
    title: "Outreach drafting",
    description:
      "Draft personalized emails/messages with context from your lead and company data.",
  },
  {
    title: "Pipeline analytics",
    description:
      "Track funnel and distribution metrics to understand what’s working.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need for the basics.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            ProspectKit focuses on the core Clay/Apollo-style workflow: build a
            list, research quickly, write outreach, and track progress.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

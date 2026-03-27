import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/ui/card";

const steps = [
  {
    title: "Build your target list",
    description:
      "Add companies, prioritize them, and keep the list clean as you iterate on your ICP.",
  },
  {
    title: "Find contacts and score leads",
    description:
      "Discover decision-makers, enrich details, and score leads based on your criteria.",
  },
  {
    title: "Draft outreach and track outcomes",
    description:
      "Generate tailored messages, update statuses, and monitor funnel and conversion metrics.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            A simple workflow your team can stick to.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            No complicated automations. Just the essentials to help you move
            faster.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, idx) => (
            <Card key={step.title}>
              <CardHeader>
                <div className="mb-2 text-xs text-muted-foreground">
                  Step {idx + 1}
                </div>
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

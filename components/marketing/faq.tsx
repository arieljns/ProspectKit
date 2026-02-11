const faqs = [
  {
    q: "Who is ProspectKit for?",
    a: "Small teams and early-stage startups that want a lightweight Clay/Apollo-style workflow for lead generation and outreach—without stitching together too many tools.",
  },
  {
    q: "Is this production-ready?",
    a: "It’s a prototype and a great starting point. For production use, plan to add hardening (auth, rate limits, audit logs, monitoring, and stricter secrets handling).",
  },
  {
    q: "Can I self-host it?",
    a: "Yes. ProspectKit is open-source and can be self-hosted for free.",
  },
  {
    q: "Does it support customizable scoring?",
    a: "Yes. You can configure your ICP and scoring weights, then score leads consistently with clear reasoning.",
  },
  {
    q: "How can I contribute?",
    a: "Open issues, submit pull requests, or sponsor development to help us keep shipping improvements.",
  },
];

export function FAQ() {
  return (
    <section id="faq">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">FAQ</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Quick answers to common questions.
          </p>
        </div>

        <div className="mt-10 max-w-3xl divide-y rounded-xl border">
          {faqs.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none text-sm font-medium">
                <div className="flex items-center justify-between gap-4">
                  <span>{item.q}</span>
                  <span className="text-muted-foreground transition group-open:rotate-180">▾</span>
                </div>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

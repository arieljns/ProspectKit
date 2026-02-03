import { Button } from "@/components/shadcnui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcnui/card";
import { ORBIT_CONTACT_MAILTO, ORBIT_REPO_URL, ORBIT_SPONSOR_URL } from "@/lib/marketing/links";

export function Pricing() {
  return (
    <section id="pricing" className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Orbit SDR is open-source. Self-host for free, or sponsor development to keep it moving.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Free self-hosted</CardTitle>
              <CardDescription>Run it on your own infrastructure.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Get the full codebase and deploy it your way. Great for startups that want control and low cost.
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <a href={ORBIT_REPO_URL} target="_blank" rel="noreferrer">
                  View setup
                </a>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Sponsor us</CardTitle>
              <CardDescription>Support maintenance and new features.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sponsorship helps us keep improving the product and shipping polished demos for the community.
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <a href={ORBIT_SPONSOR_URL} target="_blank" rel="noreferrer">
                  Sponsor on GitHub
                </a>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact us</CardTitle>
              <CardDescription>Questions, feedback, or partnerships.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Want help deploying or extending Orbit SDR for your workflow? Reach out and we’ll respond.
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <a href={ORBIT_CONTACT_MAILTO}>Email us</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}


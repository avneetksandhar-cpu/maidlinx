import Link from "next/link";
import { routes } from "@/config/site";
import { Button, Container, Heading } from "@/components/ui";

const services = [
  { title: "Home & deep cleans", description: "Houses, condos, and apartments." },
  { title: "Move & Airbnb", description: "Move-in/out and turnover cleans." },
  { title: "Office & venues", description: "Workspaces and commercial spaces." },
  { title: "Post-construction", description: "Dust and finish after renovations." },
] as const;

const reasons = [
  { title: "Reviewed Pros", description: "Pros are approved by MaidLinx ops before taking jobs." },
  { title: "Upfront pricing", description: "See an estimated total before you book." },
  { title: "Secure payments", description: "Deposit to confirm via Stripe. Remaining balance settled with support after the job." },
] as const;

export function ServiceSections() {
  return (
    <>
      <section id="services" className="py-14 lg:py-16">
        <Container>
          <Heading as="h2" className="text-2xl sm:text-3xl">
            Services
          </Heading>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <article key={service.title}>
                <Heading as="h3" className="text-lg">
                  {service.title}
                </Heading>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{service.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="why-maidlinx" className="border-y border-border bg-surface py-14 lg:py-16">
        <Container>
          <Heading as="h2" className="text-2xl sm:text-3xl">
            Why MaidLinx
          </Heading>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {reasons.map((reason) => (
              <div key={reason.title}>
                <Heading as="h3" className="text-lg">
                  {reason.title}
                </Heading>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{reason.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

export function CleanerCTA() {
  return (
    <section id="for-professionals" className="py-14 lg:py-16">
      <Container>
        <div className="rounded-xl border border-border bg-ink px-8 py-10 text-white lg:px-12 lg:py-12">
          <Heading as="h2" className="text-2xl text-white sm:text-3xl">
            Become a Pro
          </Heading>
          <p className="mt-3 max-w-lg text-white/75">
            Steady bookings, flexible schedules, and reliable payouts.
          </p>
          <Link href={routes.becomeCleaner} className="mt-6 inline-block">
            <Button variant="secondary" size="md" className="rounded-lg border-0 bg-white text-ink hover:bg-white/90">
              Apply now
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}

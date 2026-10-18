import { Container, Heading } from "@/components/ui";

const steps = [
  {
    title: "Request",
    description: "Enter your address and choose the clean — like requesting a ride.",
  },
  {
    title: "Match",
    description: "We match an available MaidLinx Pro near you.",
  },
  {
    title: "Track",
    description: "Follow job status from confirmed to on the way to in progress.",
  },
  {
    title: "Complete",
    description: "Pay securely. Rate the clean. Rebook when you need it again.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-surface py-14 lg:py-16">
      <Container>
        <Heading as="h2" className="text-2xl sm:text-3xl">
          How it works
        </Heading>
        <p className="mt-2 max-w-xl text-sm text-ink-muted sm:text-base">
          Cleaning on demand — request, match, track, complete.
        </p>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Heading as="h3" className="mt-3 text-lg">
                {step.title}
              </Heading>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

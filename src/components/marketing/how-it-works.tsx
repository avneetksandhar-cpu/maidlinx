import { Container, Heading } from "@/components/ui";

const steps = [
  {
    title: "Enter your address",
    description: "Tell us where — we match Pros nearby.",
  },
  {
    title: "Choose your clean",
    description: "Pick the service and any extras you need.",
  },
  {
    title: "Pick a time",
    description: "Select a date and arrival window that works.",
  },
  {
    title: "Relax",
    description: "Pay securely. Your Pro handles the rest.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-surface py-14 lg:py-16">
      <Container>
        <Heading as="h2" className="text-2xl sm:text-3xl">
          How it works
        </Heading>
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

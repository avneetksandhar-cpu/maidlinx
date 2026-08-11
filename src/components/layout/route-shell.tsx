import { Container, Eyebrow, Heading, Section } from "@/components/ui";

interface RouteShellProps {
  eyebrow: string;
  title: string;
}

export function RouteShell({ eyebrow, title }: RouteShellProps) {
  return (
    <Section>
      <Container narrow>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as="h1" className="mt-4">
          {title}
        </Heading>
      </Container>
    </Section>
  );
}

import { Container, Eyebrow, Heading, Section } from "@/components/ui";

interface PlatformShellProps {
  eyebrow: string;
  title: string;
}

export function PlatformShell({ eyebrow, title }: PlatformShellProps) {
  return (
    <Section className="py-12">
      <Container narrow>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as="h1" className="mt-4">
          {title}
        </Heading>
      </Container>
    </Section>
  );
}

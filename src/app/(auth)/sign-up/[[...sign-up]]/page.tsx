import { Suspense } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Container, Heading, Text } from "@/components/ui";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh px-4 py-16">
      <Container narrow>
        <SiteLogo className="mb-8" tone="brand" priority />
        <Heading as="h1" className="text-[var(--ml-dark-ink)]">
          Create your account
        </Heading>
        <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
          Customers book cleans. Cleaners apply, complete onboarding, then get approved for
          jobs.
        </Text>
        <div className="mt-8">
          <Suspense fallback={<Text muted>Loading…</Text>}>
            <AuthForm mode="sign-up" />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}

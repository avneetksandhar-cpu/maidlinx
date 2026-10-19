import { Suspense } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Container, Heading, Text } from "@/components/ui";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <div className="min-h-dvh px-4 py-16">
      <Container narrow>
        <SiteLogo className="mb-8" tone="brand" priority />
        <Heading as="h1" className="text-[var(--ml-dark-ink)]">
          Sign in
        </Heading>
        <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
          Access your MaidLinx dashboard, cleaner jobs, or admin tools.
        </Text>
        <div className="mt-8">
          <Suspense fallback={<Text muted>Loading…</Text>}>
            <AuthForm mode="sign-in" />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}

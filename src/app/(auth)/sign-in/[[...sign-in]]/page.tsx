import { Suspense } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Container, Heading, Text } from "@/components/ui";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPageCopy } from "@/components/auth/auth-page-copy";
import { BookingSaveSignInGate } from "@/components/auth/booking-save-sign-in-gate";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh px-4 py-16">
          <Container narrow>
            <SiteLogo className="mb-8" tone="brand" priority />
            <Heading as="h1" className="text-[var(--ml-dark-ink)]">
              Sign in
            </Heading>
            <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
              Continue with email.
            </Text>
          </Container>
        </div>
      }
    >
      <BookingSaveSignInGate>
        <div className="min-h-dvh px-4 py-16">
          <Container narrow>
            <SiteLogo className="mb-8" tone="brand" priority />
            <AuthPageCopy mode="sign-in" />
            <div className="mt-8">
              <AuthForm mode="sign-in" />
            </div>
          </Container>
        </div>
      </BookingSaveSignInGate>
    </Suspense>
  );
}

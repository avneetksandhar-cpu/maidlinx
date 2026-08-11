import { Suspense } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Container, Heading, Text } from "@/components/ui";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <Container narrow>
        <SiteLogo className="mb-8" priority />
        <Heading as="h1">Create your account</Heading>
        <Text muted className="mt-3">
          Customers can book cleans; cleaners can sign up to accept jobs after onboarding.
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

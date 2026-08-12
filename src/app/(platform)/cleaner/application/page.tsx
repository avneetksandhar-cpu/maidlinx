import { Suspense } from "react";
import { CleanerApplicationForm } from "@/components/cleaner/application-form";
import { ProHeader } from "@/components/pro/pro-header";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = { title: "Cleaner application" };

async function Content() {
  const { email } = await requireProfessionalSession();
  return (
    <>
      <ProHeader
        title="Cleaner application"
        description="Join the MaidLinx Verified network. No government-ID images or SSN collected here."
      />
      <CleanerApplicationForm initialEmail={email} />
    </>
  );
}

export default function CleanerApplicationPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <Content />
      </Suspense>
    </div>
  );
}

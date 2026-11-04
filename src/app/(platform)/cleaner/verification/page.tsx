import { Suspense } from "react";
import { CleanerVerificationPanel } from "@/components/cleaner/verification-panel";
import { ProHeader } from "@/components/pro/pro-header";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = { title: "Verification" };

async function Content() {
  await requireProfessionalSession();
  return (
    <>
      <ProHeader
        title="Identity & screening"
        description="Provider-agnostic verification. PENDING_PROVIDER until partners are connected — admin review required, never fabricated."
      />
      <CleanerVerificationPanel />
    </>
  );
}

export default function CleanerVerificationPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <Content />
      </Suspense>
    </div>
  );
}

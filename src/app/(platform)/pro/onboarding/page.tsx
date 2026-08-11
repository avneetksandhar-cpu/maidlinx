import { Suspense } from "react";
import { OnboardingPanel } from "@/components/pro/onboarding-panel";
import { ProHeader } from "@/components/pro/pro-header";
import { checklistProgress } from "@/lib/cleaners/onboarding";
import { getCleanerOnboarding } from "@/lib/cleaners/onboarding-store";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = {
  title: "Pro onboarding",
};

async function OnboardingContent() {
  const { profile } = await requireProfessionalSession();
  const record = await getCleanerOnboarding(profile.professionalId);
  if (!record) {
    return <p className="text-sm text-ink-muted">Unable to load onboarding.</p>;
  }

  return (
    <>
      <ProHeader
        title="Join MaidLinx Pro"
        description="Complete your application. Ops approval is required before jobs — not a background check."
      />
      <OnboardingPanel
        status={record.onboardingStatus}
        checklist={record.checklist}
        rejectionReason={record.rejectionReason}
        progress={checklistProgress(record.checklist)}
      />
    </>
  );
}

export default function ProOnboardingPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}

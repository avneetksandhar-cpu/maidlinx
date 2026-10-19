import { Suspense } from "react";
import { CleanerTrainingPanel } from "@/components/cleaner/training-panel";
import { ProHeader } from "@/components/pro/pro-header";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = { title: "MaidLinx Academy" };

async function Content() {
  await requireProfessionalSession();
  return (
    <>
      <ProHeader
        title="MaidLinx Academy"
        description="Complete required modules and pass the short assessment before activation."
      />
      <CleanerTrainingPanel />
    </>
  );
}

export default function CleanerTrainingPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <Content />
      </Suspense>
    </div>
  );
}

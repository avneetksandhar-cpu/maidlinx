import Link from "next/link";
import { Suspense } from "react";
import { DeleteAccountForm } from "@/components/dashboard/delete-account-form";
import { ProHeader } from "@/components/pro/pro-header";
import { Card, CardContent } from "@/components/ui";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Delete account",
};

async function DeleteContent() {
  await requireProfessionalSession();

  return (
    <>
      <ProHeader
        title="Delete account"
        description="Anonymize your cleaner profile and disable sign-in."
      />
      <p className="mb-4 text-sm text-ink-muted">
        <Link href={routes.cleanerSettings} className="underline underline-offset-2">
          ← Back to settings
        </Link>
      </p>
      <Card>
        <CardContent>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </>
  );
}

export default function CleanerDeleteAccountPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <DeleteContent />
      </Suspense>
    </div>
  );
}

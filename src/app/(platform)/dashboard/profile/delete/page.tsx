import Link from "next/link";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DeleteAccountForm } from "@/components/dashboard/delete-account-form";
import { Card, CardContent } from "@/components/ui";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Delete account",
};

async function DeleteAccountContent() {
  await requireCustomerSession();

  return (
    <>
      <DashboardHeader
        title="Delete account"
        description="Permanently disable your MaidLinx login and anonymize personal profile data."
      />
      <p className="mb-4 text-sm text-ink-muted">
        <Link href={routes.dashboardProfile} className="underline underline-offset-2">
          ← Back to profile
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

export default function DeleteAccountPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <DeleteAccountContent />
      </Suspense>
    </div>
  );
}

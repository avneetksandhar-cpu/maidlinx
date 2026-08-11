import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NotificationsForm } from "@/components/dashboard/notifications-form";
import { getNotificationPreferences } from "@/lib/dashboard/notifications";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Notifications",
};

async function NotificationsContent() {
  const { profile } = await requireCustomerSession();
  const preferences = await getNotificationPreferences(profile.id);

  return (
    <>
      <DashboardHeader
        title="Notifications"
        description="Choose how MaidLinx keeps you updated about bookings and offers."
      />
      <NotificationsForm preferences={preferences} />
    </>
  );
}

export default function NotificationsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <NotificationsContent />
      </Suspense>
    </div>
  );
}

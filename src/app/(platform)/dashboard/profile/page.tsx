import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Profile",
};

async function ProfileContent() {
  const { profile } = await requireCustomerSession();

  return (
    <>
      <DashboardHeader
        title="Profile"
        description="Update your contact details used for bookings and notifications."
      />
      <ProfileForm profile={profile} />
    </>
  );
}

export default function ProfilePage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

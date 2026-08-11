import { Suspense } from "react";
import { ProHeader } from "@/components/pro/pro-header";
import { ProProfileForm } from "@/components/pro/pro-profile-form";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = {
  title: "Profile",
};

async function ProfileContent() {
  const { profile } = await requireProfessionalSession();

  return (
    <>
      <ProHeader
        title="Profile"
        description="Your public professional profile visible to customers."
      />
      <ProProfileForm profile={profile} />
    </>
  );
}

export default function ProProfilePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <ProfileContent />
      </Suspense>
    </div>
  );
}

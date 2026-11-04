import { TestNightScreen } from "@/features/test-booking/TestNightScreen";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "TEST night — Wingman",
  robots: { index: false, follow: false },
};

export default async function TestNightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <TestNightScreen id={id} />
    </Suspense>
  );
}

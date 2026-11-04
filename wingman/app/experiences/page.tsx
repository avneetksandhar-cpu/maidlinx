import { CatalogListScreen } from "@/features/experiences/components/CatalogListScreen";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Wingman Experience — Wingman",
};

export default function ExperiencesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <CatalogListScreen />
    </Suspense>
  );
}

import { Suspense } from "react";
import { DetailsScreen } from "@/components/booking/screens/details-screen";

export default function BookDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <DetailsScreen />
    </Suspense>
  );
}

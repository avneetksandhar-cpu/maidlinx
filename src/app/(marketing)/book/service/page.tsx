import { Suspense } from "react";
import { ServiceScreen } from "@/components/booking/screens/service-screen";

export default function BookServicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <ServiceScreen />
    </Suspense>
  );
}

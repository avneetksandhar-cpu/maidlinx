import { Suspense } from "react";
import { DateScreen } from "@/components/booking/screens/date-screen";

export default function BookDatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <DateScreen />
    </Suspense>
  );
}

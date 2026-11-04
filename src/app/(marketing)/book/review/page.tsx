import { Suspense } from "react";
import { ReviewScreen } from "@/components/booking/screens/review-screen";

export default function BookReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <ReviewScreen />
    </Suspense>
  );
}

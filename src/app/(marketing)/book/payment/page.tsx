import { Suspense } from "react";
import { PaymentScreen } from "@/components/booking/screens/payment-screen";

export default function BookPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <PaymentScreen />
    </Suspense>
  );
}

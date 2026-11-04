import { Suspense } from "react";
import { AddressScreen } from "@/components/booking/screens/address-screen";

export default function BookAddressPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <AddressScreen />
    </Suspense>
  );
}

import { CartScreen } from "@/features/cart/CartScreen";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Cart — Wingman" };

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <CartScreen />
    </Suspense>
  );
}

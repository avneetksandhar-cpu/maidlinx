import { OrderConfirmScreen } from "@/features/cart/OrderConfirmScreen";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Confirmation — Wingman" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <OrderConfirmScreen orderId={id} />
    </Suspense>
  );
}

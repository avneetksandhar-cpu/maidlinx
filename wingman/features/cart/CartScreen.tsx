"use client";

import { QtyStepper } from "@/components/booking/QtyStepper";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cartQuantity, clearCart, loadCart, removeCartItem, setCartQuantity } from "@/lib/cart/store";
import { useHydratedCart } from "@/lib/cart/use-cart";
import { experiencePhotoAlt, experiencePhotoSrc } from "@/lib/catalog/photos";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatUsd } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function CartScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const { items, ready } = useHydratedCart();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/catalog")
      .then((response) => response.json())
      .then((payload: { products?: CatalogProduct[] }) => setProducts(payload.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  const priced = useMemo(
    () =>
      items.map((item) => {
        const product = products.find((row) => row.slug === item.catalogSlug);
        const unit = item.kind === "wingman_experience" ? (product?.priceCents ?? null) : null;
        const quantity = cartQuantity(item);
        return {
          ...item,
          quantity,
          displayPrice: unit,
          lineTotal: unit != null ? unit * quantity : null,
        };
      }),
    [items, products],
  );

  const knownTotal = priced.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);
  const itemCount = priced.reduce((sum, item) => sum + item.quantity, 0);

  async function checkout() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/cart/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: loadCart() }),
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    setBusy(false);
    if (response.status === 401) {
      router.push(`/auth?next=/cart`);
      return;
    }
    if (!response.ok || !payload.url) {
      setError(payload.error ?? "Could not start checkout.");
      return;
    }
    clearCart();
    window.location.href = payload.url;
  }

  return (
    <AppShell tone="light">
      <AppHeader title={`Cart${itemCount ? ` (${itemCount})` : ""}`} showBack backHref="/home" tone="light" />
      {search.get("cancelled") ? (
        <p className="text-sm text-neutral-500">Checkout was cancelled. Your items are still here.</p>
      ) : null}

      {!ready ? (
        <p className="mt-8 text-sm text-neutral-400">Loading cart…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your cart is empty."
          body="Add a Wingman Experience or a bookable VIP table, then pay once."
          action={
            <Link href="/home" className="text-[#FF2B8A]">
              Continue browsing
            </Link>
          }
        />
      ) : (
        <>
          <h1 className="text-[1.55rem] font-semibold text-neutral-950">Checkout</h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            Review everything, then pay once. Each booking stays separate after payment.
          </p>
          <ul className="mt-6 space-y-3">
            {priced.map((item) => (
              <li key={item.id} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {item.catalogSlug ? (
                    <Image
                      src={experiencePhotoSrc(item.catalogSlug)}
                      alt={experiencePhotoAlt(item.catalogSlug)}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                        {item.kind === "vip_table" ? "VIP Table" : "Wingman Experience"}
                      </p>
                      <h2 className="text-[15px] font-semibold text-neutral-950">{item.experienceName}</h2>
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {item.venueName ? `${item.venueName} · ` : ""}
                        {item.guestCount} guest{item.guestCount === 1 ? "" : "s"}
                        {item.drinkOption ? ` · ${item.drinkOption}` : ""}
                      </p>
                    </div>
                    <p className="text-[15px] font-semibold text-neutral-950">
                      {item.lineTotal != null ? formatUsd(item.lineTotal / 100) : "At checkout"}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <QtyStepper value={item.quantity} min={1} max={6} onChange={(next) => setCartQuantity(item.id, next)} />
                    <button type="button" className="text-[12px] text-neutral-400" onClick={() => removeCartItem(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <section className="mt-8 rounded-2xl border border-neutral-200 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Order summary</p>
            {knownTotal > 0 ? (
              <div className="mt-3 flex justify-between text-[15px]">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold text-neutral-950">{formatUsd(knownTotal / 100)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between text-[15px]">
              <span className="text-neutral-950">Total</span>
              <span className="font-semibold text-neutral-950">
                {knownTotal > 0 ? formatUsd(knownTotal / 100) : "Priced at checkout"}
              </span>
            </div>
            <p className="mt-3 text-[12px] text-neutral-400">
              Extra drinks, bottles, food, and upgrades are separate. You pay the listed experience or table price.
            </p>
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Payment</p>
            <p className="mt-2 text-[14px] text-neutral-700">Credit / debit or Apple Pay on the next screen.</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-400">
              <span aria-hidden>🔒</span> Pay securely with Stripe (TEST)
            </p>
          </section>

          {error ? <p className="mt-3 text-sm text-neutral-500">{error}</p> : null}
          <Button className="mt-6" fullWidth size="lg" loading={busy} onClick={() => void checkout()}>
            Proceed to checkout
          </Button>
          <Link href="/home" className="mt-4 block text-center text-sm text-neutral-400">
            Continue browsing
          </Link>
        </>
      )}
    </AppShell>
  );
}

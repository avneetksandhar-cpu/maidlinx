"use client";

import { BookingQr } from "@/components/booking/BookingQr";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/format";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  request_id: string | null;
  kind: string;
  experience_name: string;
  venue_name: string | null;
  drink_option: string | null;
  guest_count: number;
  unit_price_cents: number;
  request_status: string | null;
  assigned_wingman_id: string | null;
};

type Order = {
  id: string;
  status: string;
  total_cents: number;
};

export function OrderConfirmScreen({ orderId }: { orderId: string }) {
  const search = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/orders/${orderId}`)
      .then((response) => response.json())
      .then((payload: { order?: Order; items?: OrderItem[]; error?: string }) => {
        if (payload.error || !payload.order) {
          setError(payload.error ?? "Order not found.");
          return;
        }
        setOrder(payload.order);
        setItems(payload.items ?? []);
      })
      .catch(() => setError("Could not load this order."));
  }, [orderId]);

  return (
    <AppShell tone="light">
      <AppHeader title="Confirmation" showBack backHref="/bookings" tone="light" />
      <div className="flex flex-col items-center pt-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF2B8A] text-white">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-[1.7rem] font-semibold text-neutral-950">You’re all set</h1>
        <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-neutral-500">
          {search.get("paid") ? "Your experiences are confirmed. " : ""}A Wingman is assigned after payment — you do not
          pick one here.
        </p>
      </div>

      {error ? <p className="mt-4 text-center text-sm text-neutral-500">{error}</p> : null}
      {order ? (
        <p className="mt-5 text-center text-[13px] text-neutral-400">
          Total {formatUsd(order.total_cents / 100)} · {order.status.replaceAll("_", " ")}
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {items.map((item) => {
          const bookingPath = item.request_id ? `/requests/${item.request_id}` : `/orders/${orderId}`;
          return (
            <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3">
              <BookingQr value={bookingPath} label={item.experience_name} />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                  {item.kind === "vip_table" ? "VIP Table" : "Wingman Experience"}
                </p>
                <h2 className="text-[15px] font-semibold text-neutral-950">{item.experience_name}</h2>
                <p className="mt-0.5 text-[12px] text-neutral-500">
                  {item.venue_name ? `${item.venue_name} · ` : ""}
                  {item.guest_count} guest{item.guest_count === 1 ? "" : "s"}
                  {item.drink_option ? ` · ${item.drink_option}` : ""}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-neutral-950">
                  {formatUsd(item.unit_price_cents / 100)}
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  {item.request_status === "confirmed" || item.request_status === "paid"
                    ? item.assigned_wingman_id
                      ? "Wingman assigned"
                      : "Waiting for Wingman assignment"
                    : (item.request_status ?? "Pending").replaceAll("_", " ")}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <Link href="/bookings" className="mt-8 block">
        <Button fullWidth size="lg">
          View my bookings
        </Button>
      </Link>
      <Link href="/home" className="mt-4 block text-center text-sm text-neutral-400">
        Explore more experiences
      </Link>
    </AppShell>
  );
}

"use client";

import { CrownIcon } from "@/components/icons";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { CartButton } from "@/components/layout/CartButton";
import { addCartItem, newCartItemId } from "@/lib/cart/store";
import type { CatalogProduct } from "@/lib/catalog/types";
import { experienceSlugForEvent, formatListingDate } from "@/lib/events/format";
import { formatUsd } from "@/lib/format";
import type { PublicEvent, PublicOffer } from "@/lib/marketplace/queries";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ChooseExperienceScreen({ id }: { id: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/events/${id}`)
      .then((response) => response.json())
      .then((payload: { event?: PublicEvent; offers?: PublicOffer[]; error?: string }) => {
        if (payload.error || !payload.event) {
          setError(payload.error ?? "That night is not on the list.");
          return;
        }
        setEvent(payload.event);
        setOffers(payload.offers ?? []);
      })
      .catch(() => setError("Could not load this night."));
  }, [id]);

  useEffect(() => {
    void fetch("/api/catalog")
      .then((response) => response.json())
      .then((payload: { products?: CatalogProduct[] }) => setProducts(payload.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  const vipOffers = offers.filter((offer) => offer.serviceType === "vip_table" || Boolean(offer.tablePackageName));
  const canBookVip = Boolean(event?.bookable && vipOffers.length > 0);
  const slug = event ? experienceSlugForEvent(event) : "nightclub";
  const query = event
    ? `?eventId=${encodeURIComponent(event.id)}&ext=${encodeURIComponent(event.externalId)}&venue=${encodeURIComponent(event.venueName)}&date=${encodeURIComponent(event.localDate)}`
    : "";

  function addVip(offer: PublicOffer) {
    if (!event) return;
    const tableCents = (offer.minimumSpendCents ?? 0) + offer.serviceFeeCents + offer.taxesAndFeesCents;
    addCartItem({
      id: newCartItemId(),
      kind: "vip_table",
      eventId: event.id,
      eventExternalId: event.externalId,
      offerId: offer.id,
      guestCount: offer.maxGroupSize ?? 2,
      quantity: 1,
      startsAt: null,
      venueName: event.venueName,
      experienceName: offer.tablePackageName || `${event.venueName} VIP table`,
    });
    setNote(`Added ${offer.tablePackageName || "VIP table"} (${formatUsd(tableCents / 100)}) to cart.`);
  }

  return (
    <AppShell tone="light" noPadding>
      <div className="px-5">
        <AppHeader
          title="Choose your experience"
          showBack
          backHref={`/events/${encodeURIComponent(id)}`}
          rightAction={<CartButton tone="light" />}
          tone="light"
        />
      </div>
      {error ? <p className="px-5 text-sm text-neutral-500">{error}</p> : null}
      {event ? (
        <div className="flex flex-1 flex-col px-5 pb-8">
          <p className="text-[13px] text-neutral-500">
            {event.venueName} · {formatListingDate(event.localDate)} · {event.localTimeText}
          </p>

          <div className="mt-5 space-y-3">
            <article className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
                  <CrownIcon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <h2 className="text-[17px] font-semibold text-neutral-950">VIP Table</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                    Book a private table for your group. Pay the full table price. Extra purchases at the venue are
                    separate.
                  </p>
                </div>
              </div>
              {canBookVip ? (
                <div className="mt-4 space-y-3">
                  {vipOffers.map((offer) => {
                    const total =
                      (offer.minimumSpendCents ?? 0) + offer.serviceFeeCents + offer.taxesAndFeesCents;
                    return (
                      <div key={offer.id} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-950">
                            {offer.tablePackageName || "VIP table"}
                          </p>
                          <p className="text-sm text-[#FF2B8A]">{formatUsd(total / 100)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addVip(offer)}
                          className="rounded-full bg-[#FF2B8A] px-4 py-2 text-[13px] font-semibold text-white"
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[13px] text-neutral-400">No VIP tables are bookable for this night.</p>
              )}
            </article>

            <Link
              href={`/experiences/${slug}${query}`}
              className={cn(
                "block rounded-2xl border-2 border-[#FF2B8A] bg-white p-4 shadow-[0_0_0_4px_rgba(255,43,138,0.08)]",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF2B8A]/10 text-[#FF2B8A]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm-7.5 9a7.5 7.5 0 0115 0H4.5z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-[17px] font-semibold text-neutral-950">Book with a Wingman</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
                    A hosted experience — not a VIP table. You do not pick a Wingman. Admin assigns one after you pay.
                    Extra purchases are separate.
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {note ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-[#FF2B8A]">{note}</p>
              <button type="button" className="font-medium text-neutral-950" onClick={() => router.push("/cart")}>
                View cart
              </button>
            </div>
          ) : null}

          {products.length > 0 ? (
            <section className="mt-auto pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Wingman base rates
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/experiences/${product.slug}${query}`}
                    className="rounded-xl bg-neutral-50 px-2 py-3"
                  >
                    <p className="text-[12px] text-neutral-500">{product.name}</p>
                    <p className="mt-1 text-[15px] font-semibold text-neutral-950">
                      {formatUsd(product.priceCents / 100)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}

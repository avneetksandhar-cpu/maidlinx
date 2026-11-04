"use client";

import { QtyStepper } from "@/components/booking/QtyStepper";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { CartButton } from "@/components/layout/CartButton";
import { Button } from "@/components/ui/Button";
import { addCartItem, newCartItemId } from "@/lib/cart/store";
import { experiencePhotoAlt, experiencePhotoSrc } from "@/lib/catalog/photos";
import { isNightclubDrink } from "@/lib/catalog/rules";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatListingDate } from "@/lib/events/format";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CatalogExperienceScreen({ slug }: { slug: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drink, setDrink] = useState("");
  const [guests, setGuests] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState<string | null>(null);
  const eventId = search.get("eventId");
  const externalId = search.get("ext");
  const venue = search.get("venue");
  const date = search.get("date");

  useEffect(() => {
    void fetch(`/api/catalog/${slug}`)
      .then((response) => response.json())
      .then((payload: { product?: CatalogProduct; error?: string }) => {
        if (payload.error || !payload.product) {
          setError(payload.error ?? "Experience not found.");
          return;
        }
        setProduct(payload.product);
      })
      .catch(() => setError("Could not load this experience."));
  }, [slug]);

  function add() {
    if (!product) return;
    if (product.drinkOptions.length > 0 && !isNightclubDrink(drink)) {
      setNote("Choose one drink: Tequila, Vodka, or Cognac.");
      return;
    }
    if (product.maxGuests != null && guests > product.maxGuests) {
      setNote(`${product.name} is limited to ${product.maxGuests} guests.`);
      return;
    }
    addCartItem({
      id: newCartItemId(),
      kind: "wingman_experience",
      catalogSlug: product.slug,
      eventId,
      drinkOption: drink || null,
      guestCount: guests,
      quantity,
      venueName: venue,
      startsAt: date ? `${date}T23:00:00` : null,
      experienceName: product.name,
    });
    setNote("Added to cart.");
  }

  const chooseHref = externalId
    ? `/events/${encodeURIComponent(externalId)}/choose`
    : "/experiences";

  return (
    <AppShell tone="light" noPadding>
      <div className="px-5">
        <AppHeader
          title="Book with a Wingman"
          showBack
          backHref={chooseHref}
          rightAction={<CartButton tone="light" />}
          tone="light"
        />
      </div>
      {error ? <p className="px-5 text-sm text-neutral-500">{error}</p> : null}
      {product ? (
        <div className="flex flex-1 flex-col pb-8">
          <div className="relative mx-5 h-52 overflow-hidden rounded-2xl bg-neutral-200">
            <Image
              src={experiencePhotoSrc(product.slug)}
              alt={experiencePhotoAlt(product.slug)}
              fill
              className="object-cover"
              sizes="430px"
              priority
            />
          </div>

          <div className="px-5 pt-5">
            <p className="text-[13px] text-neutral-500">
              {venue || "Wingman Experience"}
              {date ? ` · ${formatListingDate(date)}` : ""}
            </p>
            <h1 className="mt-1 text-[1.55rem] font-semibold text-neutral-950">{product.name}</h1>
            <p className="mt-2 text-[2rem] font-semibold tracking-tight text-neutral-950">
              {formatUsd(product.priceCents / 100)}
            </p>
            <p className="mt-1 text-[13px] text-neutral-400">Base experience price</p>
            <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">{product.includedCopy}</p>
            <p className="mt-2 text-[13px] text-neutral-400">{product.extrasCopy}</p>
            <p className="mt-2 text-[13px] text-neutral-400">
              A Wingman is assigned after payment. You do not choose one here.
            </p>

            {product.drinkOptions.length > 0 ? (
              <div className="mt-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  One drink included
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.drinkOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDrink(option)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm",
                        drink === option
                          ? "border-[#FF2B8A] bg-[#FF2B8A] text-white"
                          : "border-neutral-200 text-neutral-700",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {product.maxGuests != null ? (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-neutral-600">Guests · max {product.maxGuests}</p>
                <QtyStepper value={guests} min={1} max={product.maxGuests} onChange={setGuests} />
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-neutral-600">Quantity</p>
              <QtyStepper value={quantity} min={1} max={6} onChange={setQuantity} />
            </div>

            <Button className="mt-8" fullWidth size="lg" onClick={add}>
              Add to cart
            </Button>
            {note ? (
              <div className="mt-3 flex items-center justify-between text-sm">
                <p className="text-[#FF2B8A]">{note}</p>
                <Link href="/cart" className="font-semibold text-neutral-950">
                  Checkout
                </Link>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col items-center gap-3 text-sm">
              <button type="button" className="text-neutral-500" onClick={() => router.push("/home")}>
                Continue browsing
              </button>
              <Link href={chooseHref} className="text-neutral-400">
                Need a VIP table instead?
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { CartButton } from "@/components/layout/CartButton";
import { experiencePhotoAlt, experiencePhotoSrc } from "@/lib/catalog/photos";
import type { CatalogProduct } from "@/lib/catalog/types";
import { formatUsd } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CatalogListScreen() {
  const search = useSearchParams();
  const eventId = search.get("eventId") ?? "";
  const venue = search.get("venue") ?? "";
  const date = search.get("date") ?? "";
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    void fetch("/api/catalog")
      .then((response) => response.json())
      .then((payload: { products?: CatalogProduct[] }) => setProducts(payload.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  const query = new URLSearchParams();
  const externalId = search.get("ext") ?? "";
  if (eventId) query.set("eventId", eventId);
  if (externalId) query.set("ext", externalId);
  if (venue) query.set("venue", venue);
  if (date) query.set("date", date);
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return (
    <AppShell showNav tone="light">
      <AppHeader title="Choose an experience" showBack backHref="/home" rightAction={<CartButton tone="light" />} tone="light" />
      <p className="text-[14px] leading-relaxed text-neutral-500">
        Not a VIP table. You do not pick a Wingman — we assign one after you pay.
      </p>
      <div className="mt-6 space-y-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/experiences/${product.slug}${suffix}`}
            className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          >
            <div className="relative h-36 bg-neutral-200">
              <Image
                src={experiencePhotoSrc(product.slug)}
                alt={experiencePhotoAlt(product.slug)}
                fill
                className="object-cover"
                sizes="430px"
              />
            </div>
            <div className="flex items-end justify-between px-4 py-3">
              <div>
                <h2 className="text-[17px] font-semibold text-neutral-950">{product.name}</h2>
                <p className="mt-1 line-clamp-2 text-[13px] text-neutral-500">{product.includedCopy}</p>
              </div>
              <p className="shrink-0 text-[16px] font-semibold text-neutral-950">
                {formatUsd(product.priceCents / 100)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

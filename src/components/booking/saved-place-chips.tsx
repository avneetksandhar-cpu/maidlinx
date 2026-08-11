"use client";

import { useCallback, useEffect, useState } from "react";
import { Briefcase, Clock, Home, MapPin } from "lucide-react";
import type { SavedAddress, StructuredAddress } from "@/lib/addresses/types";
import { structuredToBookingAddress } from "@/lib/addresses/map";
import type { Step1Address } from "@/lib/validations/booking-flow";
import {
  readRecentGuestAddresses,
  type RecentGuestAddress,
} from "@/lib/bookings/usual-clean";
import { cn } from "@/lib/utils";
import { trackBookingEvent } from "@/lib/analytics/booking";

export type SavedPlaceChipSelection = Partial<Step1Address> & {
  source: "home" | "work" | "saved" | "recent" | "guest_recent";
};

interface SavedPlaceChipsProps {
  onSelect: (selection: SavedPlaceChipSelection) => void;
  className?: string;
  /** Dark hero surface (homepage). */
  variant?: "default" | "hero";
}

function guestToStructured(address: RecentGuestAddress): StructuredAddress {
  return {
    formattedAddress: address.formattedAddress,
    addressLine1: address.line1,
    unit: address.line2,
    city: address.city,
    region: address.state,
    postalCode: address.postalCode,
    country: address.country,
    countryCode: address.country,
    latitude: address.latitude,
    longitude: address.longitude,
    placeId: address.googlePlaceId,
  };
}

function normalizeLabel(label: string | undefined): string {
  return (label ?? "").trim().toLowerCase();
}

type Chip = {
  key: string;
  label: string;
  hint: string;
  icon: typeof Home;
  address: StructuredAddress;
  source: SavedPlaceChipSelection["source"];
};

/**
 * Uber-style quick picks: Home / Work / Recent above the address field.
 * Uses signed-in saved places when available, else guest recent addresses.
 */
export function SavedPlaceChips({
  onSelect,
  className,
  variant = "default",
}: SavedPlaceChipsProps) {
  const [chips, setChips] = useState<Chip[]>([]);

  const load = useCallback(async () => {
    const guestRecent = readRecentGuestAddresses();
    let saved: SavedAddress[] = [];
    let recent: StructuredAddress | null = null;

    try {
      const response = await fetch("/api/dashboard/addresses", { credentials: "include" });
      if (response.ok) {
        const payload = (await response.json()) as {
          data?: { addresses?: SavedAddress[]; recent?: StructuredAddress | null };
        };
        saved = payload.data?.addresses ?? [];
        recent = payload.data?.recent ?? null;
      }
    } catch {
      // Guests / offline — fall back to local recent.
    }

    const next: Chip[] = [];
    const home = saved.find((a) => normalizeLabel(a.label) === "home");
    const work = saved.find((a) => normalizeLabel(a.label) === "work");

    if (home) {
      next.push({
        key: `home-${home.id}`,
        label: "Home",
        hint: home.addressLine1,
        icon: Home,
        address: home,
        source: "home",
      });
    }
    if (work) {
      next.push({
        key: `work-${work.id}`,
        label: "Work",
        hint: work.addressLine1,
        icon: Briefcase,
        address: work,
        source: "work",
      });
    }

    // Other saved (non Home/Work), capped so the row stays scannable.
    for (const place of saved) {
      if (place.id === home?.id || place.id === work?.id) continue;
      if (next.length >= 4) break;
      next.push({
        key: `saved-${place.id}`,
        label: place.label || "Saved",
        hint: place.addressLine1,
        icon: MapPin,
        address: place,
        source: "saved",
      });
    }

    if (recent) {
      const duplicate = next.some(
        (chip) =>
          chip.address.addressLine1 === recent.addressLine1 &&
          chip.address.postalCode === recent.postalCode,
      );
      if (!duplicate) {
        next.push({
          key: "server-recent",
          label: "Recent",
          hint: recent.addressLine1,
          icon: Clock,
          address: recent,
          source: "recent",
        });
      }
    }

    if (next.length === 0 && guestRecent[0]) {
      const first = guestRecent[0];
      next.push({
        key: `guest-${first.line1}-${first.postalCode}`,
        label: first.label === "Home" || first.label === "Work" ? first.label : "Recent",
        hint: first.line1,
        icon: first.label === "Home" ? Home : first.label === "Work" ? Briefcase : Clock,
        address: guestToStructured(first),
        source: "guest_recent",
      });
    }

    // Extra guest recents if still room.
    for (const guest of guestRecent.slice(next.length === 0 ? 1 : 0)) {
      if (next.length >= 4) break;
      const structured = guestToStructured(guest);
      const duplicate = next.some(
        (chip) =>
          chip.address.addressLine1 === structured.addressLine1 &&
          chip.address.postalCode === structured.postalCode,
      );
      if (duplicate) continue;
      next.push({
        key: `guest-${guest.line1}-${guest.postalCode}-${guest.savedAt}`,
        label: "Recent",
        hint: guest.line1,
        icon: Clock,
        address: structured,
        source: "guest_recent",
      });
    }

    setChips(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (chips.length === 0) return null;

  const isHero = variant === "hero";

  return (
    <div className={cn("space-y-2", className)}>
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          isHero ? "text-teal-100/80" : "text-ink-muted",
        )}
      >
        Saved & recent
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {chips.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                const address = structuredToBookingAddress(chip.address);
                trackBookingEvent("address_selected", {
                  source: chip.source,
                  placeId: address.googlePlaceId,
                });
                onSelect({ ...address, source: chip.source });
              }}
              className={cn(
                "flex min-h-12 min-w-[7.5rem] shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-transform active:scale-[0.98]",
                isHero
                  ? "bg-white/12 ring-1 ring-white/20 hover:bg-white/18"
                  : "border border-border bg-surface hover:border-border-strong",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  isHero ? "bg-white/15 text-white" : "bg-surface-muted text-navy",
                )}
              >
                <Icon className="size-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    isHero ? "text-white" : "text-ink",
                  )}
                >
                  {chip.label}
                </span>
                <span
                  className={cn(
                    "block truncate text-xs",
                    isHero ? "text-white/65" : "text-ink-muted",
                  )}
                >
                  {chip.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

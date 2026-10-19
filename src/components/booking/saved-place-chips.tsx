"use client";

import { useCallback, useEffect, useState, startTransition } from "react";
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
  source: "home" | "office" | "rental" | "work" | "saved" | "recent" | "guest_recent";
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
 * Uber-style quick picks: Home / Office / Rental / Recent above the address field.
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
    const office = saved.find(
      (a) => normalizeLabel(a.label) === "office" || normalizeLabel(a.label) === "work",
    );
    const rental = saved.find((a) => normalizeLabel(a.label) === "rental");

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
    if (office) {
      next.push({
        key: `office-${office.id}`,
        label: "Office",
        hint: office.addressLine1,
        icon: Briefcase,
        address: office,
        source: "office",
      });
    }
    if (rental) {
      next.push({
        key: `rental-${rental.id}`,
        label: "Rental",
        hint: rental.addressLine1,
        icon: MapPin,
        address: rental,
        source: "rental",
      });
    }

    // Other saved (non Home/Office/Rental), capped so the row stays scannable.
    for (const place of saved) {
      if (place.id === home?.id || place.id === office?.id || place.id === rental?.id) continue;
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
      const named =
        first.label === "Home" ||
        first.label === "Office" ||
        first.label === "Work" ||
        first.label === "Rental"
          ? first.label === "Work"
            ? "Office"
            : first.label
          : "Recent";
      next.push({
        key: `guest-${first.line1}-${first.postalCode}`,
        label: named,
        hint: first.line1,
        icon:
          named === "Home"
            ? Home
            : named === "Office"
              ? Briefcase
              : named === "Rental"
                ? MapPin
                : Clock,
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

    startTransition(() => {
      setChips(next);
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (chips.length === 0) return null;

  const isHero = variant === "hero";

  return (
    <div className={cn("space-y-2", className)}>
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          isHero ? "text-teal-100/80" : "text-[var(--color-ink-muted)]",
        )}
      >
        Saved properties
      </p>
      <div className="grid gap-2">
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
                "flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-transform active:scale-[0.99]",
                isHero
                  ? "bg-white/12 ring-1 ring-white/20 hover:bg-white/18"
                  : "border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  isHero
                    ? "bg-white/15 text-white"
                    : "bg-[var(--color-accent-muted)] text-[var(--color-accent)]",
                )}
              >
                <Icon className="size-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    isHero ? "text-white" : "text-[var(--color-ink)]",
                  )}
                >
                  {chip.label}
                </span>
                <span
                  className={cn(
                    "block truncate text-xs",
                    isHero ? "text-white/65" : "text-[var(--color-ink-muted)]",
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

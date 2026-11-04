"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { CommercialCtaButton } from "@/components/commercial/commercial-book-chrome";
import {
  frequencyShortLabel,
  isCommercialBookReady,
  readCommercialBookDraft,
  type CommercialBookDraft,
} from "@/lib/commercial/book-draft";
import { routes } from "@/config/site";

/**
 * Screen A — Book a commercial clean.
 * Property / Service / Frequency open one step at a time, then Find cleaning teams.
 * Brand lockup lives in BusinessShell (founder circular mark) — no duplicate header.
 */
export function CommercialBookHome() {
  const [draft, setDraft] = useState<CommercialBookDraft | null>(null);

  useEffect(() => {
    setDraft(readCommercialBookDraft());
    const onFocus = () => setDraft(readCommercialBookDraft());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const ready = draft ? isCommercialBookReady(draft) : false;

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 pb-4 lg:max-w-[430px]">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#04CED2] uppercase">
          South Florida
        </p>
        <h1 className="text-[1.85rem] leading-tight font-bold tracking-tight text-white">
          Book a commercial clean.
        </h1>
      </header>

      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
        <Image
          src="/booking/cat-office.jpg"
          alt="Modern South Florida office ready for a commercial clean"
          fill
          className="object-cover"
          sizes="390px"
          priority
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#01193D]/55 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface,#102B49)]">
        <SelectRow
          href={routes.dashboardBookProperty}
          icon={<Building2 className="size-5" aria-hidden />}
          label="Property"
          value={draft?.siteLabel ?? "Select property"}
          filled={Boolean(draft?.siteId)}
        />
        <SelectRow
          href={routes.dashboardBookService}
          icon={<Sparkles className="size-5" aria-hidden />}
          label="Service"
          value={draft?.serviceLabel ?? "Select service"}
          filled={Boolean(draft?.serviceId)}
          disabled={!draft?.siteId}
        />
        <SelectRow
          href={routes.dashboardBookFrequency}
          icon={<CalendarDays className="size-5" aria-hidden />}
          label="Frequency"
          value={
            draft?.frequency
              ? frequencyShortLabel(draft.frequency)
              : "Select frequency"
          }
          filled={Boolean(draft?.frequency)}
          disabled={!draft?.serviceId}
          last
        />
      </div>

      {!ready ? (
        <p className="text-center text-sm text-[var(--ml-dark-ink-muted)]">
          Choose property, then service, then frequency — one step at a time.
        </p>
      ) : null}

      <CommercialCtaButton
        href={ready ? routes.dashboardBookTeams : undefined}
        disabled={!ready}
      >
        Find cleaning teams
      </CommercialCtaButton>
    </div>
  );
}

function SelectRow({
  href,
  icon,
  label,
  value,
  filled,
  disabled,
  last,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  filled: boolean;
  disabled?: boolean;
  last?: boolean;
}) {
  const inner = (
    <div
      className={
        last
          ? "flex items-center gap-3 px-4 py-3.5"
          : "flex items-center gap-3 border-b border-white/10 px-4 py-3.5"
      }
    >
      <span className="text-[#04CED2]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium tracking-wide text-white/55 uppercase">
          {label}
        </span>
        <span
          className={
            filled
              ? "mt-0.5 block truncate text-[15px] font-semibold text-white"
              : "mt-0.5 block truncate text-[15px] font-medium text-white/45"
          }
        >
          {value}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-[#04CED2]" aria-hidden />
    </div>
  );

  if (disabled) {
    return (
      <div className="opacity-40" aria-disabled>
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className="block transition-colors hover:bg-white/5">
      {inner}
    </Link>
  );
}

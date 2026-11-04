import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { routes } from "@/config/site";

export const metadata = {
  title: "Commercial book UI preview",
  robots: { index: false, follow: false },
};

/**
 * DEV-ONLY layout preview for 390px screenshots when supply=0 / no session.
 * Gated by ALLOW_BOOKING_UI_FIXTURE=true. Never invents providers, prices, maps, or ETAs.
 * Query: ?screen=a|b|c (default a)
 */
export default async function CommercialBookUiPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_BOOKING_UI_FIXTURE === "true";
  if (!allowed) notFound();

  const params = await searchParams;
  const screen = (params.screen ?? "a").toLowerCase();

  return (
    <div
      data-theme="ml-dark"
      className="min-h-dvh bg-[var(--ml-dark-bg,#01193D)] text-white"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto flex w-full max-w-[390px] flex-col px-4 pt-3 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <BrandLockup href={routes.dashboard} size="default" tone="onDark" priority />
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#04CED2] uppercase">
            UI preview
          </span>
        </div>

        {screen === "b" ? <ScreenB /> : screen === "c" ? <ScreenC /> : <ScreenA />}

        <nav className="mt-8 flex justify-center gap-3 text-xs text-white/50">
          <Link href="?screen=a" className="underline-offset-2 hover:underline">
            A
          </Link>
          <Link href="?screen=b" className="underline-offset-2 hover:underline">
            B
          </Link>
          <Link href="?screen=c" className="underline-offset-2 hover:underline">
            C
          </Link>
        </nav>
      </div>
    </div>
  );
}

function ScreenA() {
  return (
    <div className="space-y-5" data-screen="a">
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
          alt=""
          fill
          className="object-cover"
          sizes="390px"
          priority
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--ml-dark-surface,#102B49)]">
        <Row
          icon={<Building2 className="size-5" />}
          label="Property"
          value="Select property"
          muted
        />
        <Row
          icon={<Sparkles className="size-5" />}
          label="Service"
          value="Select service"
          muted
        />
        <Row
          icon={<CalendarDays className="size-5" />}
          label="Frequency"
          value="Select frequency"
          muted
          last
        />
      </div>
      <p className="text-center text-sm text-white/55">
        Choose property, then service, then frequency — one step at a time.
      </p>
      <button
        type="button"
        disabled
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D] opacity-40"
      >
        Find cleaning teams
      </button>
    </div>
  );
}

function ScreenB() {
  return (
    <div className="space-y-5" data-screen="b">
      <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
        Choose a cleaning team
      </h1>
      <p className="text-sm text-white/55">
        Weekly · site TBD — real proposals only
      </p>
      <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface)] px-4 py-8 text-center">
        <p className="text-sm font-semibold text-white">No eligible teams yet</p>
        <p className="mt-1.5 text-sm text-white/55">
          BOOKABLE supply is empty — we only show real commercial_proposals /
          assigned crews. No sample providers or invented prices.
        </p>
        <p className="mt-4 text-sm font-semibold text-[#04CED2]">
          Request quotes from Sites when ready
        </p>
      </div>
    </div>
  );
}

function ScreenC() {
  return (
    <div className="space-y-4" data-screen="c">
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight text-white">
        Booking confirmed
      </h1>
      <p className="text-sm text-white/65">
        Your visit is reserved. Add entry instructions so the crew can get in.
      </p>
      <div className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)] px-4 py-4 text-sm">
        <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
          Visit details
        </p>
        <p className="mt-2 font-semibold text-white">Property · Suite TBD</p>
        <p className="mt-1 text-white/70">Cleaning team · Assigned crew</p>
        <p className="mt-1 text-white/70">Arrival window · 6:00 – 8:00 PM</p>
        <p className="mt-1 text-white/70">Price / visit · from proposal</p>
        <p className="mt-1 text-white/45">Paid today · $0 (Stripe LIVE OFF)</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)] px-4 py-4">
        <p className="text-[1.25rem] font-bold text-white">Scheduled</p>
        <p className="mt-1 text-sm text-white/65">Arrival 6:00 – 8:00 PM</p>
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 px-4 py-5 text-center">
          <MapPin className="mx-auto size-6 text-[#04CED2]" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-white">Live map unavailable</p>
          <p className="mt-1 text-sm text-white/55">
            Map and ETA only with consented live location. No simulated route.
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-[#04CED2]/35 bg-[var(--ml-dark-surface)] px-4 py-4">
        <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
          After-hours entry
        </p>
        <p className="mt-1 text-[1.05rem] font-bold text-white">
          How should the crew get in?
        </p>
        <p className="mt-2 text-sm text-white/60">
          Check in at reception · Call on arrival · Designated entrance
        </p>
        <button
          type="button"
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#04CED2] text-sm font-semibold text-[#01193D]"
        >
          Add entry instructions
        </button>
      </div>
      <button
        type="button"
        className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#04CED2] text-base font-semibold text-[#01193D]"
      >
        <MessageCircle className="size-5" aria-hidden />
        Message crew
      </button>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  muted,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
  last?: boolean;
}) {
  return (
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
            muted
              ? "mt-0.5 block text-[15px] font-medium text-white/45"
              : "mt-0.5 block text-[15px] font-semibold text-white"
          }
        >
          {value}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-[#04CED2]" aria-hidden />
    </div>
  );
}

import { Car } from "lucide-react";

/** Decorative homepage demo — not live customer tracking. */
export function BookingPreview() {
  return (
    <div className="relative mt-4 rounded-[18px] border border-[var(--maidlinx-border)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="absolute right-3 top-3 rounded-md bg-[var(--maidlinx-mint)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--maidlinx-green)] uppercase">
        Booking preview
      </div>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--maidlinx-green)] uppercase">
        MaidLinx
      </p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--maidlinx-ink)]">
        Pro arriving soon
      </p>
      <p className="mt-0.5 text-sm text-[var(--maidlinx-muted)]">Today · 2–4 pm window</p>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-[var(--maidlinx-mint)] text-sm font-semibold text-[var(--maidlinx-green)]">
          ML
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--maidlinx-ink)]">MaidLinx Pro</p>
          <p className="text-xs text-[var(--maidlinx-muted)]">MaidLinx Pro</p>
        </div>
        <div className="relative flex size-14 items-center justify-center rounded-xl bg-[var(--maidlinx-mint-soft)]" aria-hidden>
          <Car className="size-6 text-[var(--maidlinx-green)]" strokeWidth={1.5} />
          <span className="absolute -top-1.5 -right-1.5 rounded-md bg-[var(--maidlinx-green)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            Demo
          </span>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--maidlinx-border)]">
        <div className="h-full w-2/3 rounded-full bg-[var(--maidlinx-green)]" />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-[var(--maidlinx-muted)]">
        <span>On the way</span>
        <span>5 min away</span>
      </div>
    </div>
  );
}

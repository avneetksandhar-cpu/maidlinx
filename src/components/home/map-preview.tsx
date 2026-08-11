import { Crosshair } from "lucide-react";

export function MapPreview() {
  return (
    <div className="relative mt-4 h-[220px] overflow-hidden rounded-[18px] border border-[var(--maidlinx-border)] bg-[var(--maidlinx-mint-soft)] sm:h-[260px] lg:h-[280px]">
      {/* Decorative map grid — not live availability */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            linear-gradient(rgba(8,127,101,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(8,127,101,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 35% 40%, rgba(8,127,101,0.12), transparent 42%), radial-gradient(circle at 70% 65%, rgba(8,127,101,0.08), transparent 40%)",
        }}
        aria-hidden
      />
      <div className="absolute left-[48%] top-[46%] -translate-x-1/2 -translate-y-full" aria-hidden>
        <div className="relative flex flex-col items-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--maidlinx-green)] shadow-md ring-4 ring-white">
            <span className="size-2.5 rounded-full bg-white" />
          </div>
          <div className="h-3 w-0.5 bg-[var(--maidlinx-green)]" />
        </div>
      </div>
      <div className="absolute left-4 top-4 max-w-[220px] rounded-xl border border-[var(--maidlinx-border)] bg-white px-3.5 py-3 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-2.5">
          <Crosshair
            className="mt-0.5 size-4 shrink-0 text-[var(--maidlinx-green)]"
            strokeWidth={1.75}
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-[var(--maidlinx-ink)]">Near you</p>
            <p className="mt-0.5 text-xs leading-snug text-[var(--maidlinx-muted)]">
              Check availability near you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

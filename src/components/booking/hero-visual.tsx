/**
 * Premium product preview for the homepage hero — brand-colored abstract UI mock
 * (no stock illustration). Purely presentational.
 */
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0fdfa] via-white to-[#e8f5f3] shadow-card ring-1 ring-border/80 sm:aspect-[5/6]">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 50% at 80% 10%, rgba(13,148,136,0.18), transparent 55%), radial-gradient(circle at 10% 90%, rgba(17,24,39,0.04), transparent 45%)",
          }}
        />

        {/* Soft lifestyle plane */}
        <div className="absolute inset-x-6 top-6 bottom-[42%] rounded-xl bg-gradient-to-b from-white/90 to-white/40 shadow-soft ring-1 ring-white/80" />
        <div className="absolute inset-x-10 top-12 h-24 rounded-lg bg-[#d1fae5]/50" />
        <div className="absolute inset-x-14 top-20 h-3 rounded-full bg-ink/8" />
        <div className="absolute inset-x-14 top-28 h-2.5 w-2/3 rounded-full bg-ink/5" />

        {/* Floating booking card */}
        <div className="absolute inset-x-5 bottom-5 animate-[riseIn_0.7s_ease_both] rounded-xl bg-white p-4 shadow-elevated ring-1 ring-border/70 sm:inset-x-7 sm:bottom-7 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
            MaidLinx
          </p>
          <p className="mt-2 font-display text-lg font-semibold tracking-tight text-ink">
            Pro arriving soon
          </p>
          <p className="mt-1 text-sm text-ink-muted">Today · 2–4 pm window</p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent">
              ML
            </span>
            <div className="min-w-0 flex-1">
              <div className="h-2 w-24 rounded-full bg-ink/10" />
              <div className="mt-1.5 h-1.5 w-16 rounded-full bg-ink/5" />
            </div>
            <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              Live
            </span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
            <div className="h-full w-2/3 rounded-full bg-accent transition-[width] duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useLayoutEffect, useState } from "react";

export const OVERVIEW_PIN_SETTLED_KEY = "maidlinx.overview.pinSettled";

type PinPhase = "settled" | "lifted" | "dropping";

/**
 * Compact pale coastal map for Overview — decorative only (not live coverage).
 * Mint pin settles once on first visit (500ms); later visits / reduced-motion stay settled.
 * pointer-events: none so address + booking controls stay tappable from frame one.
 * Does not request location permission.
 */
export function OverviewCoastalMap({ className }: { className?: string }) {
  const [phase, setPhase] = useState<PinPhase>("settled");

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let alreadySettled = false;
    try {
      alreadySettled = window.localStorage.getItem(OVERVIEW_PIN_SETTLED_KEY) === "1";
    } catch {
      alreadySettled = true;
    }

    if (reduced || alreadySettled) {
      setPhase("settled");
      return;
    }

    setPhase("lifted");
    try {
      window.localStorage.setItem(OVERVIEW_PIN_SETTLED_KEY, "1");
    } catch {
      /* private mode — still animate this session */
    }

    let dropRaf = 0;
    const liftRaf = window.requestAnimationFrame(() => {
      dropRaf = window.requestAnimationFrame(() => setPhase("dropping"));
    });

    const done = window.setTimeout(() => setPhase("settled"), 520);

    return () => {
      window.cancelAnimationFrame(liftRaf);
      window.cancelAnimationFrame(dropRaf);
      window.clearTimeout(done);
    };
  }, []);

  const pinY = phase === "lifted" ? -10 : 0;
  const shadowOpacity = phase === "lifted" ? 0.35 : phase === "dropping" ? 0.12 : 0;
  const shadowScale = phase === "lifted" ? 1 : phase === "dropping" ? 0.7 : 0.55;
  const pinTransition =
    phase === "dropping" || phase === "settled"
      ? "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none";
  const shadowTransition =
    phase === "dropping" || phase === "settled"
      ? "opacity 500ms cubic-bezier(0.22, 1, 0.36, 1), transform 500ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none";

  return (
    <div className={className} aria-hidden>
      <svg
        viewBox="0 0 360 160"
        className="block h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mlCoastSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EAF5F8" />
            <stop offset="40%" stopColor="#F2F7F3" />
            <stop offset="100%" stopColor="#EEF3EC" />
          </linearGradient>
          <linearGradient id="mlCoastWater" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C5E9E6" />
            <stop offset="50%" stopColor="#B5DDE8" />
            <stop offset="100%" stopColor="#A4D0DC" />
          </linearGradient>
          <clipPath id="mlCoastCurve">
            <path d="M0 0 H360 V148 C300 160 60 160 0 148 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#mlCoastCurve)">
          <rect width="360" height="160" fill="url(#mlCoastSky)" />

          {/* Faint mint land blocks */}
          <g fill="#D4E8D1" opacity="0.7">
            <rect x="18" y="28" width="54" height="36" rx="3" />
            <rect x="82" y="22" width="42" height="28" rx="3" />
            <rect x="138" y="34" width="48" height="32" rx="3" />
            <rect x="198" y="18" width="58" height="40" rx="3" />
            <rect x="268" y="30" width="46" height="34" rx="3" />
            <rect x="40" y="78" width="44" height="26" rx="3" />
            <rect x="220" y="72" width="52" height="30" rx="3" />
          </g>

          {/* Pale street grid */}
          <g stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.95">
            <path d="M0 48 H360" />
            <path d="M0 78 H360" />
            <path d="M0 108 H360" />
            <path d="M72 0 V160" />
            <path d="M144 0 V160" />
            <path d="M216 0 V160" />
            <path d="M288 0 V160" />
          </g>
          <g stroke="#E8F0EA" strokeWidth="1" opacity="0.8">
            <path d="M0 63 H360" />
            <path d="M0 93 H360" />
            <path d="M108 0 V160" />
            <path d="M252 0 V160" />
          </g>

          {/* Coastal water */}
          <path
            d="M0 102 C48 90 78 112 120 104 C162 96 188 118 230 110 C272 102 300 122 360 112 V160 H0 Z"
            fill="url(#mlCoastWater)"
          />
          <path
            d="M0 118 C55 108 95 126 145 118 C195 110 230 130 280 122 C320 116 345 126 360 124 V160 H0 Z"
            fill="#9ECAD5"
            opacity="0.4"
          />

          {/* Soft shoreline */}
          <path
            d="M0 100 C50 90 80 108 122 100 C164 92 190 112 232 104 C274 96 305 114 360 106"
            fill="none"
            stroke="#F3EFE4"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
      </svg>

      {/* Soft ground shadow — strongest while pin is lifted */}
      <div
        className="pointer-events-none absolute left-[52%] top-[58%]"
        style={{
          width: 28,
          height: 10,
          marginLeft: -14,
          borderRadius: "50%",
          background: "rgba(1, 25, 61, 0.28)",
          filter: "blur(5px)",
          opacity: shadowOpacity,
          transform: `scale(${shadowScale})`,
          transition: shadowTransition,
        }}
      />

      <div
        className="pointer-events-none absolute left-[52%] top-[42%]"
        style={{
          transform: `translate(-50%, calc(-100% + ${pinY}px))`,
          transition: pinTransition,
          willChange: phase === "dropping" ? "transform" : undefined,
        }}
      >
        <div className="relative flex flex-col items-center">
          <div className="relative flex size-9 items-center justify-center rounded-full bg-[#04CED2] shadow-[0_4px_14px_rgba(1,25,61,0.28)] ring-[3px] ring-white/90">
            <CleaningSparkle className="size-4 text-[#01193D]" />
          </div>
          <div
            className="h-0 w-0 border-x-[6px] border-t-[9px] border-x-transparent border-t-[#04CED2]"
            style={{ marginTop: -1 }}
          />
        </div>
      </div>
    </div>
  );
}

function CleaningSparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5 13.2 8.2 18.5 7l-3.8 4.2 4.3 3.2-5.6-.6L12 19.5l-1.4-5.7-5.6.6 4.3-3.2L5.5 7l5.3 1.2L12 2.5Z" />
      <path
        d="M18.5 3.2 19 5.2l2 .4-1.6 1.2.6 1.9-1.8-.7-1.7.9.3-2-1.4-1.4 2-.1.6-2.2Z"
        opacity="0.85"
      />
    </svg>
  );
}

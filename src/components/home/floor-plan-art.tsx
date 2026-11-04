/**
 * Turquoise wireframe floor-plan for Home — scales down on short phones
 * so address + Check availability stay above the fold.
 */
export function FloorPlanArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect
        x="8"
        y="12"
        width="304"
        height="156"
        rx="4"
        stroke="#04CED2"
        strokeWidth="2"
        opacity="0.9"
      />
      {/* Living */}
      <rect x="20" y="28" width="120" height="88" rx="2" stroke="#04CED2" strokeWidth="1.5" />
      <path d="M36 48h40M36 58h28" stroke="#04CED2" strokeWidth="1.2" opacity="0.7" />
      <circle cx="96" cy="72" r="14" stroke="#04CED2" strokeWidth="1.2" opacity="0.55" />
      {/* Kitchen */}
      <rect x="148" y="28" width="72" height="88" rx="2" stroke="#04CED2" strokeWidth="1.5" />
      <rect x="160" y="40" width="48" height="18" rx="1" stroke="#04CED2" strokeWidth="1.2" />
      <rect x="160" y="68" width="20" height="28" rx="1" stroke="#04CED2" strokeWidth="1.2" />
      {/* Bedroom */}
      <rect x="228" y="28" width="72" height="88" rx="2" stroke="#04CED2" strokeWidth="1.5" />
      <rect x="240" y="48" width="48" height="28" rx="2" stroke="#04CED2" strokeWidth="1.2" />
      {/* Bath */}
      <rect x="20" y="124" width="56" height="32" rx="2" stroke="#04CED2" strokeWidth="1.5" />
      <circle cx="40" cy="140" r="7" stroke="#04CED2" strokeWidth="1.2" />
      {/* Hall */}
      <path d="M84 124h152v32" stroke="#04CED2" strokeWidth="1.5" />
      <path d="M148 116v8M228 116v8" stroke="#04CED2" strokeWidth="1.5" />
    </svg>
  );
}

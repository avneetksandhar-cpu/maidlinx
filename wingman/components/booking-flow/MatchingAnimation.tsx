"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";

export function MatchingAnimation() {
  return (
    <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
      <span className="wm-pulse-ring absolute inset-2 rounded-full border border-[#00C2FF]/25" />
      <span className="wm-pulse-ring absolute inset-8 rounded-full border border-[#8B5CFF]/20 [animation-delay:0.7s]" />
      <WingmanLogo size={64} title="Wingman" />
    </div>
  );
}

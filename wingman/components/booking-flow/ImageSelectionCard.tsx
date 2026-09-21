"use client";

import { cn } from "@/lib/utils";

export function ImageSelectionCard({
  selected,
  onSelect,
  title,
  imageSrc,
  imageAlt,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "overflow-hidden rounded-[16px] border text-left transition-colors duration-200",
        selected ? "border-[#00C2FF]/70" : "border-white/10",
      )}
    >
      <span className="relative block aspect-[4/3] bg-[#111114]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
      </span>
      <span className="block px-3 py-2.5 text-[13px] font-medium leading-5 text-white">{title}</span>
    </button>
  );
}

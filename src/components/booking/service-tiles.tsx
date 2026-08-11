"use client";

import { Building2, Home, KeyRound, MoreHorizontal, Truck, HardHat } from "lucide-react";
import { SERVICE_TILES, type ServiceTileKey } from "@/config/services";
import { cn } from "@/lib/utils";

const TILE_ICONS: Record<ServiceTileKey, typeof Home> = {
  home: Home,
  office: Building2,
  airbnb: KeyRound,
  move: Truck,
  construction: HardHat,
  more: MoreHorizontal,
};

interface ServiceTilesProps {
  value?: ServiceTileKey | null;
  onSelect: (tileKey: ServiceTileKey, defaultServiceSlug: string) => void;
  className?: string;
}

export function ServiceTiles({ value, onSelect, className }: ServiceTilesProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {SERVICE_TILES.map((tile) => {
        const Icon = TILE_ICONS[tile.key];
        const selected = value === tile.key;
        return (
          <button
            key={tile.key}
            type="button"
            onClick={() => onSelect(tile.key, tile.defaultServiceSlug)}
            aria-pressed={selected}
            className={cn(
              "flex flex-col items-start gap-2 border px-4 py-4 text-left transition-colors duration-200",
              selected
                ? "border-accent bg-accent/5 text-ink"
                : "border-border bg-surface text-ink hover:border-ink/30",
            )}
          >
            <Icon className="size-5 text-accent" strokeWidth={1.75} aria-hidden />
            <span className="text-base font-semibold tracking-tight">{tile.label}</span>
            <span className="text-sm leading-snug text-ink-muted">{tile.description}</span>
          </button>
        );
      })}
    </div>
  );
}

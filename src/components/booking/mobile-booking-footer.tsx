"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface MobileBookingFooterProps {
  label: string;
  onPrimary: () => void;
  onBack?: () => void;
  showBack?: boolean;
  disabled?: boolean;
  loading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

export function MobileBookingFooter({
  label,
  onPrimary,
  onBack,
  showBack = false,
  disabled = false,
  loading = false,
  secondaryLabel,
  onSecondary,
  className,
}: MobileBookingFooterProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-surface/98 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-surface-muted"
          >
            <ChevronLeft className="size-6" strokeWidth={2} />
          </button>
        ) : null}
        {secondaryLabel && onSecondary ? (
          <Button type="button" variant="ghost" onClick={onSecondary} className="shrink-0">
            {secondaryLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="min-h-12 flex-1 rounded-xl text-base font-semibold"
          onClick={onPrimary}
          disabled={disabled || loading}
        >
          {loading ? "Please wait…" : label}
        </Button>
      </div>
    </div>
  );
}

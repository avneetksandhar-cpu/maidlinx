import { BrandLockup } from "@/components/brand/brand-lockup";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Navy header matching Home + Bookings mockups —
 * circular mark + MaidLinx left, South Florida right.
 */
export function CustomerMarketHeader({
  className,
  homeHref = routes.home,
}: {
  className?: string;
  homeHref?: string;
}) {
  return (
    <header
      className={cn(
        "relative z-20 flex items-center justify-between gap-3 bg-[#01193D] px-5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-3",
        className,
      )}
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <BrandLockup href={homeHref} size="default" tone="onDark" priority />
      <p className="shrink-0 text-[13px] font-semibold tracking-tight text-white/90 sm:text-[14px]">
        South Florida
      </p>
    </header>
  );
}

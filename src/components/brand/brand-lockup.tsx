import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export type BrandLockupSize = "default" | "compact";
export type BrandLockupTone = "onDark" | "onLight";

type BrandLockupProps = {
  className?: string;
  /** Circular mark size + wordmark scale. Compact keeps booking CTAs visible. */
  size?: BrandLockupSize;
  /**
   * onDark — midnight navy surfaces: Maid white, Linx #04CED2
   * onLight — light surfaces: Maid navy, Linx #04CED2
   */
  tone?: BrandLockupTone;
  /** When set, wraps the lockup in a home link. */
  href?: string;
  priority?: boolean;
  /** Hide the text wordmark (mark only). */
  markOnly?: boolean;
};

const SIZE = {
  default: { mark: 40, text: "text-[17px] leading-none sm:text-[18px]", gap: "gap-2" },
  compact: { mark: 28, text: "text-[14px] leading-none", gap: "gap-1.5" },
} as const;

/**
 * Founder brand lockup — circular real mark + MaidLinx wordmark (capital M + L).
 * One line at small iPhone widths; system font, bold brand name.
 */
export function BrandLockup({
  className,
  size = "default",
  tone = "onDark",
  href,
  priority = false,
  markOnly = false,
}: BrandLockupProps) {
  const dims = SIZE[size];
  const maidClass = tone === "onDark" ? "text-white" : "text-[#01193D]";
  const linxClass = "text-[#04CED2]";

  const content = (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center whitespace-nowrap",
        dims.gap,
        className,
      )}
    >
      <Image
        src="/brand/maidlinx-mark.png"
        alt=""
        width={dims.mark}
        height={dims.mark}
        className="shrink-0 rounded-full object-cover"
        style={{ width: dims.mark, height: dims.mark }}
        priority={priority}
        aria-hidden={markOnly ? undefined : true}
      />
      {markOnly ? (
        <span className="sr-only">{siteConfig.name}</span>
      ) : (
        <span
          className={cn(
            "font-bold tracking-[-0.02em]",
            dims.text,
          )}
          aria-label={siteConfig.name}
        >
          <span className={maidClass}>Maid</span>
          <span className={linxClass}>Linx</span>
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="inline-flex max-w-full shrink-0 items-center"
      aria-label={`${siteConfig.name} home`}
    >
      {content}
    </Link>
  );
}

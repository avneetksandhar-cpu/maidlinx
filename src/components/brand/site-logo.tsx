import Image from "next/image";
import Link from "next/link";
import { siteConfig, routes } from "@/config/site";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  /** Horizontal lockup for headers; mark for compact spaces. */
  variant?: "horizontal" | "mark";
  /**
   * onLight — navy lockup for white / light surfaces (default)
   * onDark — light lockup for navy sidebars
   * brand — official teal-fill lockup (welcome / splash)
   */
  tone?: "onLight" | "onDark" | "brand";
  href?: string;
  priority?: boolean;
};

const ASSETS = {
  horizontal: {
    onLight: {
      src: "/brand/maidlinx-logo-light.png",
      width: 170,
      height: 84,
      className: "h-9 w-auto sm:h-10",
    },
    onDark: {
      src: "/brand/maidlinx-logo.png",
      width: 170,
      height: 84,
      className: "h-9 w-auto sm:h-10 brightness-0 invert",
    },
    brand: {
      src: "/brand/maidlinx-logo.png",
      width: 170,
      height: 84,
      className: "h-10 w-auto sm:h-12",
    },
  },
  mark: {
    onLight: {
      src: "/brand/maidlinx-mark.png",
      width: 40,
      height: 40,
      className: "h-9 w-9",
    },
    onDark: {
      src: "/brand/maidlinx-mark-light.png",
      width: 40,
      height: 40,
      className: "h-9 w-9",
    },
    brand: {
      src: "/brand/maidlinx-mark.png",
      width: 40,
      height: 40,
      className: "h-10 w-10",
    },
  },
} as const;

export function SiteLogo({
  className,
  variant = "horizontal",
  tone = "onLight",
  href = routes.home,
  priority = false,
}: SiteLogoProps) {
  const asset = ASSETS[variant][tone];

  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <Image
        src={asset.src}
        alt={siteConfig.name}
        width={asset.width}
        height={asset.height}
        className={cn("object-contain", asset.className)}
        priority={priority}
      />
    </Link>
  );
}

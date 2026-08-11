import Image from "next/image";
import Link from "next/link";
import { siteConfig, routes } from "@/config/site";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  /** Horizontal lockup for headers; mark for compact spaces. */
  variant?: "horizontal" | "mark";
  href?: string;
  priority?: boolean;
};

const ASSETS = {
  horizontal: {
    src: "/brand/maidlinx-logo.png",
    width: 170,
    height: 84,
    className: "h-9 w-auto sm:h-10",
  },
  mark: {
    src: "/brand/maidlinx-mark.png",
    width: 40,
    height: 40,
    className: "h-9 w-9",
  },
} as const;

export function SiteLogo({
  className,
  variant = "horizontal",
  href = routes.home,
  priority = false,
}: SiteLogoProps) {
  const asset = ASSETS[variant];

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

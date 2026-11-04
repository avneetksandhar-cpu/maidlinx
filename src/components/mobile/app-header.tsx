"use client";

import {
  BrandHeader,
  type BrandHeaderProps,
} from "@/components/brand/brand-header";

interface AppHeaderProps {
  /** Logo destination */
  homeHref: string;
  /** Optional back control */
  onBack?: () => void;
  backHref?: string;
  /** Right-side actions (profile, menu, help) */
  trailing?: React.ReactNode;
  /** Show hamburger / menu affordance slot on the left instead of back */
  leading?: React.ReactNode;
  className?: string;
  /** @deprecated Prefer BrandHeader size — mark maps to compact markOnly */
  logoVariant?: "mark" | "horizontal";
  /** Center logo in the bar. Default true. */
  centerLogo?: boolean;
  size?: BrandHeaderProps["size"];
}

/**
 * Customer mobile chrome — midnight navy + MaidLinx brand lockup.
 * Prefer importing BrandHeader directly for new screens.
 */
export function AppHeader({
  homeHref,
  onBack,
  backHref,
  trailing,
  leading,
  className,
  logoVariant = "horizontal",
  centerLogo = true,
  size = "default",
}: AppHeaderProps) {
  return (
    <BrandHeader
      homeHref={homeHref}
      onBack={onBack}
      backHref={backHref}
      trailing={trailing}
      leading={leading}
      className={className}
      size={size}
      align={centerLogo ? "center" : "start"}
      markOnly={logoVariant === "mark"}
      tone="onDark"
      surface="navy"
    />
  );
}

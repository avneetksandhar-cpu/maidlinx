import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

const styles: Record<HeadingLevel, string> = {
  h1: "font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl",
  h2: "font-display text-3xl font-semibold tracking-tight sm:text-4xl",
  h3: "font-display text-2xl font-semibold tracking-tight",
  h4: "font-display text-xl font-semibold tracking-tight",
};

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingLevel;
  balance?: boolean;
}

export function Heading({
  as: Tag = "h2",
  balance = false,
  className,
  ...props
}: HeadingProps) {
  return (
    <Tag
      className={cn(styles[Tag], balance && "text-balance", className)}
      {...props}
    />
  );
}

export function Text({
  className,
  muted = false,
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { muted?: boolean }) {
  return (
    <p
      className={cn(
        "text-base leading-7",
        muted ? "text-ink-muted" : "text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.18em] text-accent",
        className,
      )}
      {...props}
    />
  );
}

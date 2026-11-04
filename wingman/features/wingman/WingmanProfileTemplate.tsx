import type { ReactNode } from "react";

/** Renders only when a real verified Wingman exists. Never populate with sample people. */
export function WingmanProfileTemplate({
  verified,
  children,
}: {
  verified: boolean;
  children?: ReactNode;
}) {
  if (!verified) return null;
  return (
    <article className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-label text-accent">Verified Wingman</p>
      {children}
    </article>
  );
}

export const WINGMAN_PROFILE_FIELDS = [
  "displayName",
  "areas",
  "languages",
  "specialties",
  "biography",
  "responseWindowMinutes",
  "availableVirtually",
  "availableInPerson",
  "experiencedVenues",
] as const;

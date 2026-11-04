"use client";

import { BackIcon, ShareIcon, VerifiedBadge } from "@/components/icons";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SampleMark } from "@/components/ui/SampleMark";
import { getExperience } from "@/features/home/data/experiences";
import { getPromoter, type Promoter } from "@/features/promoters/data/promoters";
import { formatSampleFromPrice } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PromoterProfileScreen({ promoter }: { promoter: Promoter }) {
  const router = useRouter();
  const linked = promoter.experienceIds
    .map((id) => getExperience(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <AppShell showNav noPadding>
      <div className="relative h-[38dvh] min-h-[240px] w-full overflow-hidden">
        <Image
          src={promoter.photoUrl}
          alt={promoter.photoAlt}
          fill
          priority
          className="object-cover object-top"
          sizes="430px"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/40" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/45 text-ink backdrop-blur-sm"
          >
            <BackIcon />
          </button>
          <button
            type="button"
            aria-label="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/45 text-ink backdrop-blur-sm"
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      <div className="px-5 pb-8 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <SampleMark>Sample profile</SampleMark>
          {promoter.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
              <VerifiedBadge className="h-3.5 w-3.5" />
              Verified (as shown)
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 text-3xl tracking-tight text-ink">{promoter.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">{promoter.city}</p>

        <dl className="mt-5 space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle">Focus</dt>
            <dd className="mt-1 text-sm text-ink">{promoter.venues.join(" · ")}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle">Availability</dt>
            <dd className="mt-1 text-sm text-accent">{promoter.availability}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle">Shown as</dt>
            <dd className="mt-1 text-sm text-ink">{promoter.accessOffered}</dd>
          </div>
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-ink-muted">{promoter.bio}</p>
        <p className="mt-3 text-sm text-accent">{formatSampleFromPrice(promoter.minimumSpend)}</p>

        {linked.length > 0 ? (
          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
              Sample evenings in this style
            </p>
            <ul className="mt-2 space-y-2">
              {linked.map((experience) => (
                <li key={experience.id}>
                  <Link href={`/experiences/${experience.id}`} className="text-sm text-ink hover:text-accent">
                    {experience.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          <p className="text-sm leading-relaxed text-ink-muted">
            You do not need to message a directory of people. Ask your Wingman to plan the evening.
          </p>
          <Button
            size="lg"
            fullWidth
            onClick={() =>
              router.push(
                `/booking?promoterId=${promoter.id}&experienceId=${promoter.experienceIds[0] ?? ""}`,
              )
            }
          >
            Request through your Wingman
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export function PromoterProfileLoader({ id }: { id: string }) {
  const promoter = getPromoter(id);
  if (!promoter) {
    return (
      <AppShell showNav>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-ink-muted">Profile not found.</p>
          <Link href="/promoters" className="mt-4 text-accent">
            Back to profiles
          </Link>
        </div>
      </AppShell>
    );
  }
  return <PromoterProfileScreen promoter={promoter} />;
}

"use client";

import {
  BackIcon,
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  ShareIcon,
  ShirtIcon,
  AgeIcon,
} from "@/components/icons";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SampleMark } from "@/components/ui/SampleMark";
import { getExperience, type Experience } from "@/features/home/data/experiences";
import { formatSampleFromPrice } from "@/lib/format";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 text-accent">
        {icon}
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle">{label}</p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

export function ExperienceDetailScreen({ experience }: { experience: Experience }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  return (
    <AppShell showNav noPadding>
      <div className="relative h-[46dvh] min-h-[280px] w-full overflow-hidden">
        <Image
          src={experience.imageUrl}
          alt={experience.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="430px"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-background/40" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/45 text-ink backdrop-blur-sm"
          >
            <BackIcon />
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Share"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/45 text-ink backdrop-blur-sm"
            >
              <ShareIcon />
            </button>
            <button
              type="button"
              aria-label="Save"
              onClick={() => setSaved((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/45 text-ink backdrop-blur-sm"
            >
              <HeartIcon active={saved} className={saved ? "text-accent" : undefined} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pb-8 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <SampleMark>Sample idea</SampleMark>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            {experience.categoryLabel}
          </span>
        </div>
        <h1 className="mt-2 text-3xl tracking-tight text-ink">{experience.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{experience.location}</p>

        <div className="mt-4 divide-y divide-border border-y border-border">
          <MetaRow icon={<CalendarIcon />} label="Date" value={experience.dateLabel} />
          <MetaRow icon={<ClockIcon />} label="Time" value={experience.timeLabel} />
          <MetaRow icon={<ShirtIcon />} label="Dress" value={experience.dressCode} />
          <MetaRow icon={<AgeIcon />} label="Age" value={experience.ageRequirement} />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink-muted">{experience.description}</p>
        <p className="mt-3 text-sm font-medium text-accent">{formatSampleFromPrice(experience.priceFrom)}</p>
        <p className="mt-1 text-xs text-ink-subtle">
          Not live inventory. A request is not a reservation. Sample prices are not a $500 rule.
        </p>

        <Link href={`/booking?experienceId=${experience.id}`} className="mt-6 block">
          <Button size="lg" fullWidth>
            Request this evening
          </Button>
        </Link>
      </div>
    </AppShell>
  );
}

export function ExperienceDetailLoader({ id }: { id: string }) {
  const experience = getExperience(id);
  if (!experience) {
    return (
      <AppShell showNav>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-ink-muted">Experience not found.</p>
          <Link href="/home" className="mt-4 text-accent">
            Back home
          </Link>
        </div>
      </AppShell>
    );
  }
  return <ExperienceDetailScreen experience={experience} />;
}

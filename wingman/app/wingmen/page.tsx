"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { AtmospherePhoto } from "@/components/media/AtmospherePhoto";
import { Button } from "@/components/ui/Button";
import { InterestForm } from "@/features/interest/InterestForm";
import { ASSIGNED_HOST_NAME } from "@/lib/marketplace/host-copy";
import { PLAN_HEADER_PHOTO } from "@/lib/photos/atmosphere";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function WingmenPage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    void fetch("/api/wingmen")
      .then((response) => response.json())
      .then((payload: { count?: number }) => setCount(payload.count ?? 0));
  }, []);

  return (
    <AppShell showNav>
      <AppHeader title="Wingmen" showBack backHref="/home" />
      <AtmospherePhoto photo={PLAN_HEADER_PHOTO} className="mb-8 h-72 w-full" sizes="720px" priority />
      <p className="text-label">Miami insider</p>
      <h1 className="font-display mt-2 text-5xl text-ink">{ASSIGNED_HOST_NAME.split(" ")[0]}</h1>
      <p className="mt-3 text-[0.95rem] text-ink-muted">Brickell · South Beach · Downtown</p>
      <p className="mt-6 max-w-sm text-[1.05rem] leading-relaxed text-ink">
        Dinner, nightlife, tables, and everything between.
      </p>
      <p className="mt-4 text-[0.85rem] text-ink-subtle">
        {count === 0 || count === null
          ? "Andres is your private host for now. More insiders later."
          : `${count} verified Wingmen.`}
      </p>
      <Link href="/book?source=wingman" className="mt-8 block">
        <Button fullWidth size="lg">
          Book with Andres · $500
        </Button>
      </Link>
      <Link href="/plan" className="mt-4 block text-center text-sm text-ink-subtle">
        Or plan the night first
      </Link>
      <div className="mt-14">
        <InterestForm
          source="wingman_apply"
          heading="Become a Wingman"
          cta="Ask about hosting"
        />
      </div>
    </AppShell>
  );
}

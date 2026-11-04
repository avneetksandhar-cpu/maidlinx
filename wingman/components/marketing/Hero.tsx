"use client";

import { AtmospherePhoto } from "@/components/media/AtmospherePhoto";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { fadeUp, motionOrFade } from "@/lib/animations";
import { HERO_PHOTO } from "@/lib/photos/atmosphere";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  const reduced = useReducedMotion();
  const enter = motionOrFade(reduced);

  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="pointer-events-none absolute inset-0">
        <AtmospherePhoto
          photo={HERO_PHOTO}
          className="h-full w-full"
          sizes="100vw"
          priority
          showCaption={false}
          overlay={false}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,12,0.35)_0%,rgba(7,7,12,0.62)_48%,rgba(7,7,12,0.96)_100%)]"
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_18%_0%,rgba(255,43,214,0.16),transparent_58%),radial-gradient(ellipse_60%_40%_at_88%_12%,rgba(0,232,240,0.12),transparent_52%)] ${reduced ? "" : "hero-ambient"}`}
      />

      <div className="section-container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div custom={0} variants={reduced ? enter : fadeUp}>
              <SectionLabel>Lounges · hookah · clubs · raves · events</SectionLabel>
            </motion.div>

            <motion.h1
              custom={0.08}
              variants={reduced ? enter : fadeUp}
              className="text-display mt-6 text-balance text-ink"
            >
              Miami nights. One Wingman.
            </motion.h1>

            <motion.p
              custom={0.16}
              variants={reduced ? enter : fadeUp}
              className="mx-auto mt-6 max-w-xl text-subheading text-ink-muted"
            >
              Pick a night, confirm $500, then chat. The $500 is the start-the-night service — not a
              table at a listed venue.
            </motion.p>

            <motion.div
              custom={0.24}
              variants={reduced ? enter : fadeUp}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link
                href="/book"
                className="gold-btn cta-glow inline-flex h-16 min-w-[188px] items-center justify-center rounded-2xl px-8 text-lg font-bold tracking-tight text-white transition-[transform,filter] hover:brightness-110 active:translate-y-[3px] motion-reduce:active:translate-y-0"
              >
                Book $500
              </Link>
              <Link
                href="/events"
                className="inline-flex h-16 min-w-[188px] items-center justify-center rounded-2xl border border-white/20 px-8 text-base font-semibold text-ink transition-colors hover:border-accent/50 hover:bg-white/5"
              >
                Tonight in Miami
              </Link>
            </motion.div>
            <motion.p
              custom={0.32}
              variants={reduced ? enter : fadeUp}
              className="mx-auto mt-6 text-sm text-ink-subtle"
            >
              <Link href="/plan" className="underline-offset-4 hover:underline">
                Plan My Night
              </Link>
              {" · "}
              <Link href="/auth" className="underline-offset-4 hover:underline">
                Sign in
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

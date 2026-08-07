"use client";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { fadeUp } from "@/lib/animations";
import { motion } from "framer-motion";
import Link from "next/link";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 001.5.86l10.5-6.86a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-accent" fill="currentColor" aria-hidden>
      <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.27l-4.94 2.44.94-5.5-4-3.9 5.53-.8L10 1.5z" />
    </svg>
  );
}

function DeviceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      {/* Laptop mockup */}
      <div className="relative z-10 rounded-lg border border-border-subtle bg-surface p-2 shadow-2xl shadow-black/60">
        <div className="overflow-hidden rounded-md border border-border bg-background-alt">
          <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-red-500/60" />
            <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
            <span className="h-2 w-2 rounded-full bg-green-500/60" />
            <span className="ml-2 text-[10px] text-ink-subtle">wingman.app</span>
          </div>
          <div className="grid grid-cols-3 gap-2 p-3">
            <div className="col-span-1 space-y-2">
              <div className="h-2 w-full rounded bg-accent/30" />
              <div className="h-2 w-3/4 rounded bg-border" />
              <div className="h-2 w-full rounded bg-border" />
              <div className="mt-3 h-8 rounded bg-accent/20" />
            </div>
            <div className="col-span-2 space-y-2">
              <div className="flex gap-2">
                <div className="h-16 flex-1 rounded bg-gradient-to-br from-accent/20 to-transparent border border-border-gold" />
                <div className="h-16 flex-1 rounded bg-surface-elevated border border-border" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded bg-surface border border-border" />
                <div className="h-10 rounded bg-surface border border-border" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone mockup */}
      <div className="absolute -bottom-6 -right-4 z-20 w-28 rounded-2xl border-2 border-border-subtle bg-surface p-1 shadow-xl shadow-black/50 sm:-right-8 sm:w-32">
        <div className="overflow-hidden rounded-xl bg-background-alt">
          <div className="bg-accent/20 px-2 py-3 text-center">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-accent">VIP Access</p>
          </div>
          <div className="space-y-1.5 p-2">
            <div className="h-8 rounded bg-surface border border-border-gold" />
            <div className="h-6 rounded bg-surface border border-border" />
            <div className="h-6 rounded bg-accent/30" />
          </div>
        </div>
      </div>

      {/* Glow effect */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-full bg-accent/5 blur-3xl"
      />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,169,98,0.08),transparent)]"
      />

      <div className="section-container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            <motion.div custom={0} variants={fadeUp}>
              <SectionLabel>MIAMI&apos;S PREMIER MARKETPLACE</SectionLabel>
            </motion.div>

            <motion.h1
              custom={0.1}
              variants={fadeUp}
              className="text-display mt-6 font-bold text-balance text-ink"
            >
              Access Miami&apos;s Most{" "}
              <span className="gold-gradient-text">Exclusive</span> Experiences
            </motion.h1>

            <motion.p
              custom={0.2}
              variants={fadeUp}
              className="mt-6 max-w-xl text-subheading text-ink-muted lg:mx-0 mx-auto"
            >
              Verified hosts. VIP access. From yacht charters to private dining —
              discover Miami&apos;s finest, curated for members who expect more.
            </motion.p>

            <motion.div
              custom={0.3}
              variants={fadeUp}
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
            >
              <Link href="/onboarding">
                <Button size="lg" className="min-w-[180px]">
                  Request Access
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="min-w-[180px]">
                <PlayIcon />
                Watch Overview
              </Button>
            </motion.div>

            <motion.div
              custom={0.4}
              variants={fadeUp}
              className="mt-10 flex items-center justify-center gap-4 lg:justify-start"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-surface-elevated text-[10px] font-medium text-accent"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <p className="mt-0.5 text-xs text-ink-subtle">
                  Trusted by 2,000+ members
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative px-4 lg:px-0"
          >
            <DeviceMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

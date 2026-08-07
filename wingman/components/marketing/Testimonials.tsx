"use client";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { motion } from "framer-motion";

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-accent" fill="currentColor" aria-hidden>
      <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.27l-4.94 2.44.94-5.5-4-3.9 5.53-.8L10 1.5z" />
    </svg>
  );
}

const testimonials = [
  {
    quote:
      "Wingman got us a yacht for Art Basel weekend when every broker said it was impossible. Flawless experience.",
    name: "Marcus R.",
    title: "Member since 2024",
    initials: "MR",
  },
  {
    quote:
      "The VIP table at LIV was ready before we arrived. No waiting, no hassle. This is how Miami should work.",
    name: "Sofia L.",
    title: "Platinum Member",
    initials: "SL",
  },
  {
    quote:
      "I've tried every concierge service in Miami. Wingman is the only one that actually delivers on exclusivity.",
    name: "James K.",
    title: "Founder, Tech",
    initials: "JK",
  },
];

export function Testimonials() {
  return (
    <section id="about" className="section-padding bg-background">
      <div className="section-container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel>Member Stories</SectionLabel>
            <h2 className="text-heading mt-4 font-bold text-ink">
              What Our{" "}
              <span className="gold-gradient-text">Members</span> Say
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} />
              ))}
            </div>
            <span className="text-sm text-ink-muted">4.9 on Google</span>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card variant="elevated" padding="lg" className="h-full">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <StarIcon key={j} />
                  ))}
                </div>
                <blockquote className="mt-5 text-sm leading-relaxed text-ink-muted">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-ink-subtle">{t.title}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

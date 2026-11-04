"use client";

import { motion } from "framer-motion";

const notes = ["Lounges", "Hookah", "Clubs", "Raves", "Events"];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-background-alt py-8">
      <div className="section-container">
        <p className="mb-6 text-center text-label tracking-[0.2em] text-ink-subtle">
          Miami nightlife — listings are not partnerships
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {notes.map((note, i) => (
            <motion.span
              key={note}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="font-display text-sm font-semibold tracking-[0.14em] text-ink"
            >
              {note}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

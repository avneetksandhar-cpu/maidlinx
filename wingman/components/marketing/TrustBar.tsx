"use client";

import { motion } from "framer-motion";

const brands = [
  "Faena",
  "LIV",
  "Zuma",
  "Papi Steak",
  "Story",
  "Miami Beach",
];

export function TrustBar() {
  return (
    <section className="border-y border-border bg-background-alt py-8">
      <div className="section-container">
        <p className="mb-6 text-center text-label text-ink-subtle tracking-[0.3em]">
          Trusted By Miami&apos;s Finest
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand, i) => (
            <motion.span
              key={brand}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="text-sm font-medium uppercase tracking-[0.2em] text-ink-subtle/60 transition-colors hover:text-ink-muted"
            >
              {brand}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}

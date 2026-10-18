"use client";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Pick a night",
    body: "Choose a listing or Plan My Night. That is context — not a reserved table.",
  },
  {
    title: "Confirm $500",
    body: "One screen. Scope and conduct. Server total is $500.",
  },
  {
    title: "Chat with Your Wingman",
    body: "After a paid webhook confirmation, chat unlocks with the one assigned host.",
  },
];

export function Testimonials() {
  return (
    <section id="about" className="section-padding bg-background">
      <div className="section-container">
        <div>
          <SectionLabel>How an evening works</SectionLabel>
          <h2 className="text-heading mt-4 text-ink">Honest from the first request</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-muted">
            There are no member reviews on this page. When people write in, they will be labeled as
            such. We do not invent quotes or ratings.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Card variant="elevated" padding="lg" className="h-full">
                <p className="text-label text-accent">0{i + 1}</p>
                <h3 className="mt-4 text-xl text-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

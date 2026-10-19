"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { motion } from "framer-motion";

const problems = [
  "Ten chats to plan one night",
  "No one assigned after you pay",
  "Listings that look like reserved tables",
  "Romance or door promises that are not real",
];

const solutions = [
  "Pick a night or Plan My Night",
  "Confirm $500 for the Wingman service",
  "Secure checkout",
  "Chat with the one assigned host",
];

export function WhyWingman() {
  return (
    <section id="how-it-works" className="section-padding bg-background">
      <div className="section-container">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionLabel>The usual night</SectionLabel>
            <h2 className="text-heading mt-4 text-ink">Hard to start. Easy to stall.</h2>
            <ul className="mt-8 space-y-4">
              {problems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-muted">
                  <span className="mt-0.5 text-red-400/70">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto hidden lg:block"
          >
            <div className="flex h-40 w-40 items-center justify-center rounded-full border border-border bg-surface">
              <WingmanLogo size={88} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <SectionLabel>The short path</SectionLabel>
            <h2 className="text-heading mt-4 text-ink">Your Wingman for the night</h2>
            <ul className="mt-8 space-y-4">
              {solutions.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink-muted">
                  <span className="mt-0.5 text-accent">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

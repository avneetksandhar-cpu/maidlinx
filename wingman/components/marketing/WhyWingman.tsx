"use client";

import { SectionLabel } from "@/components/marketing/SectionLabel";
import { motion } from "framer-motion";

function XIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-red-400/70" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" d="M6 6l8 8M14 6l-8 8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l3 3 7-7" />
    </svg>
  );
}

const problems = [
  "Endless calls to get a table or yacht",
  "No way to verify host quality",
  "Generic booking sites with no VIP access",
  "Last-minute cancellations and no support",
];

const solutions = [
  "Instant access to verified experiences",
  "Every host vetted for quality & discretion",
  "Members-only pricing and priority booking",
  "Dedicated concierge from inquiry to checkout",
];

export function WhyWingman() {
  return (
    <section id="how-it-works" className="section-padding bg-background">
      <div className="section-container">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-heading mt-4 font-bold text-ink">
              Miami Luxury Is{" "}
              <span className="text-ink-muted">Hard to Access</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {problems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <XIcon />
                  <span className="text-sm text-ink-muted">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Center visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative mx-auto hidden lg:block"
          >
            <div className="relative h-64 w-64">
              <div className="absolute inset-0 rounded-full border border-border-gold/30" />
              <div className="absolute inset-4 rounded-full border border-accent/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 shadow-[0_0_40px_rgba(201,169,98,0.2)]">
                  <span className="text-3xl font-bold text-accent">W</span>
                </div>
              </div>
              {["Discover", "Book", "Experience", "Return"].map((step, i) => {
                const angle = (i * 90 - 90) * (Math.PI / 180);
                const x = Math.cos(angle) * 110;
                const y = Math.sin(angle) * 110;
                return (
                  <span
                    key={step}
                    className="absolute text-[10px] font-medium uppercase tracking-wider text-accent"
                    style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: "translate(-50%, -50%)" }}
                  >
                    {step}
                  </span>
                );
              })}
            </div>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SectionLabel>The Wingman Way</SectionLabel>
            <h2 className="text-heading mt-4 font-bold text-ink">
              Your Private{" "}
              <span className="gold-gradient-text">Concierge</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {solutions.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-ink-muted">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Mobile flow diagram */}
        <div className="mt-12 flex justify-center gap-6 lg:hidden">
          {["Discover", "Book", "Experience", "Return"].map((step) => (
            <span key={step} className="text-label text-accent">{step}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

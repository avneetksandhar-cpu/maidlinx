"use client";

import { Button } from "@/components/ui/Button";
import { fadeUp } from "@/lib/animations";
import { motion } from "framer-motion";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="section-padding bg-background-alt">
      <div className="section-container">
        <div className="card-glow grid items-center gap-10 rounded-[1.75rem] bg-surface px-8 py-12 lg:grid-cols-2 lg:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 custom={0} variants={fadeUp} className="text-heading font-bold text-ink">
              Start the night for $500
            </motion.h2>
            <motion.p custom={0.1} variants={fadeUp} className="mt-4 max-w-md text-ink-muted">
              Confirm the Wingman service, pay securely, then chat with the one assigned host.
              Not a table at a listed club.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            <motion.div custom={0.15} variants={fadeUp}>
              <Link href="/book" className="block">
                <Button size="lg" fullWidth>
                  Book $500
                </Button>
              </Link>
            </motion.div>
            <motion.div custom={0.22} variants={fadeUp}>
              <Link href="/plan" className="block">
                <Button variant="secondary" size="lg" fullWidth>
                  Plan My Night
                </Button>
              </Link>
            </motion.div>
            <motion.p custom={0.28} variants={fadeUp} className="text-center text-xs text-ink-subtle">
              Secure checkout. Not a reserved table.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

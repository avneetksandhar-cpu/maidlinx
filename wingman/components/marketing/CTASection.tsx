"use client";

import { Button } from "@/components/ui/Button";
import { fadeUp } from "@/lib/animations";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export function CTASection() {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = "/onboarding";
  }

  return (
    <section className="section-padding bg-background-alt">
      <div className="section-container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              custom={0}
              variants={fadeUp}
              className="text-heading font-bold text-ink"
            >
              Ready to Access{" "}
              <span className="gold-gradient-text">Miami&apos;s Best?</span>
            </motion.h2>
            <motion.p
              custom={0.1}
              variants={fadeUp}
              className="mt-4 max-w-md text-ink-muted"
            >
              Join Wingman today. Request membership and our team will review
              your application within 24 hours.
            </motion.p>
          </motion.div>

          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <motion.div custom={0.15} variants={fadeUp}>
              <label htmlFor="cta-name" className="sr-only">
                Full name
              </label>
              <input
                id="cta-name"
                type="text"
                placeholder="Full name"
                className="h-12 w-full rounded-lg border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-subtle focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </motion.div>
            <motion.div custom={0.2} variants={fadeUp}>
              <label htmlFor="cta-email" className="sr-only">
                Email address
              </label>
              <input
                id="cta-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-lg border border-border bg-surface px-4 text-sm text-ink placeholder:text-ink-subtle focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </motion.div>
            <motion.div custom={0.25} variants={fadeUp}>
              <Link href="/onboarding">
                <Button type="submit" size="lg" fullWidth>
                  Join Wingman
                </Button>
              </Link>
            </motion.div>
            <motion.p custom={0.3} variants={fadeUp} className="text-center text-xs text-ink-subtle">
              No spam. Membership is by application only.
            </motion.p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

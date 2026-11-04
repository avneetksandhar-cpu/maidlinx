"use client";

import { motion } from "framer-motion";

const points = [
  { value: "Paid evenings", label: "Membership is not a badge" },
  { value: "Request first", label: "Nothing is held until you pay" },
  { value: "One Wingman", label: "Not ten chats to plan a night" },
  { value: "Private", label: "No public spend or guest lists" },
];

export function StatsRow() {
  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {points.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p className="font-display text-2xl text-accent md:text-3xl">{stat.value}</p>
              <p className="mt-2 text-sm text-ink-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

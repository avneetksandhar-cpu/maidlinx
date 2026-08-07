"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "500+", label: "Verified Experiences" },
  { value: "$2M+", label: "In Member Bookings" },
  { value: "150+", label: "Elite Host Partners" },
  { value: "4.9★", label: "Average Member Rating" },
];

export function StatsRow() {
  return (
    <section className="section-padding bg-background">
      <div className="section-container">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-accent md:text-4xl lg:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-ink-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

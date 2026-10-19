"use client";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { listItemVariants, staggerList } from "@/lib/animations";
import { motion, useReducedMotion } from "framer-motion";

const categories = [
  { title: "Lounges", subtitle: "Late rooms, lower lights" },
  { title: "Hookah", subtitle: "Longer sits, same city" },
  { title: "Clubs", subtitle: "Official calendars, not partnerships" },
  { title: "Raves", subtitle: "Warehouse and late sets" },
  { title: "Events", subtitle: "What’s listed tonight" },
];

export function CategoryGrid() {
  const reduced = useReducedMotion();
  const item = listItemVariants(reduced);

  return (
    <section id="experiences" className="section-padding bg-background-alt">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Tonight’s map</SectionLabel>
          <h2 className="text-heading mt-4 text-ink">What the night can be</h2>
          <p className="mt-4 text-ink-muted">
            Categories for browsing. A listing is not a Wingman partnership and not a reserved table.
          </p>
        </div>

        <motion.div
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={reduced ? undefined : staggerList}
        >
          {categories.map((cat) => (
            <motion.div key={cat.title} variants={item}>
              <Card padding="lg" className="h-full text-center">
                <h3 className="text-base font-semibold text-ink">{cat.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{cat.subtitle}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

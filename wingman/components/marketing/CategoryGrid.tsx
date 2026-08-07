"use client";

import { Card } from "@/components/ui/Card";
import { SectionLabel } from "@/components/marketing/SectionLabel";
import { motion } from "framer-motion";

type Category = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
};

function DiningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path strokeLinecap="round" d="M6 3v8M4 3v3M8 3v3M6 11v10M18 3v18M14 3v8a4 4 0 004 4" />
    </svg>
  );
}

function YachtIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18M5 14l2-8h10l2 8M8 14h8M12 6V3" />
    </svg>
  );
}

function NightlifeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path strokeLinecap="round" d="M12 3v18M8 7h8M7 12h10M6 17h12" />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path strokeLinecap="round" d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}

function WellnessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-4.5-6-10a4 4 0 018 0 4 4 0 018 0c0 5.5-6 10-6 10z" />
    </svg>
  );
}

function VIPIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3 7h7l-5.5 4 2 7L12 17l-6.5 3 2-7L2 9h7l3-7z" />
    </svg>
  );
}

function ArtIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function TravelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
  );
}

const categories: Category[] = [
  { title: "Fine Dining", subtitle: "Avg. $450 per table", icon: <DiningIcon /> },
  { title: "Yacht Charters", subtitle: "From $2,500/day", icon: <YachtIcon /> },
  { title: "Nightlife", subtitle: "VIP table access", icon: <NightlifeIcon /> },
  { title: "Private Events", subtitle: "Exclusive venues", icon: <EventsIcon /> },
  { title: "Wellness", subtitle: "Spa & retreats", icon: <WellnessIcon /> },
  { title: "VIP Access", subtitle: "Members-only", icon: <VIPIcon /> },
  { title: "Art & Culture", subtitle: "Gallery previews", icon: <ArtIcon /> },
  { title: "Luxury Travel", subtitle: "Curated getaways", icon: <TravelIcon /> },
];

export function CategoryGrid() {
  return (
    <section id="experiences" className="section-padding bg-background-alt">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Curated Categories</SectionLabel>
          <h2 className="text-heading mt-4 font-bold text-ink">
            Every Experience,{" "}
            <span className="gold-gradient-text">Handpicked</span>
          </h2>
          <p className="mt-4 text-ink-muted">
            From sunset sails to Michelin-starred tables — explore Miami&apos;s most
            coveted experiences, all verified and ready to book.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                variant="gold-top"
                padding="lg"
                className="group h-full text-center transition-colors hover:bg-surface-elevated"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center text-accent transition-transform group-hover:scale-110">
                  {cat.icon}
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink">{cat.title}</h3>
                <p className="mt-1.5 text-sm text-accent">{cat.subtitle}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

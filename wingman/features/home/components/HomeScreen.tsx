"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import {
  featuredExperiences,
  homeCategories,
  type ExperienceCategory,
} from "@/features/home/data/experiences";
import { fadeUpShort } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const fadeUp = fadeUpShort;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-ink-subtle"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  );
}

function ExperienceCard({
  experience,
  index,
}: {
  experience: (typeof featuredExperiences)[number];
  index: number;
}) {
  return (
    <motion.div
      custom={0.15 + index * 0.06}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <Link
        href={`/experiences/${experience.id}`}
        className="group relative block overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={experience.imageUrl}
            alt={experience.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="430px"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
          />
          {experience.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black">
              {experience.badge}
            </span>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            {experience.location}
          </p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-ink">
            {experience.title}
          </h3>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-ink-muted">Host · {experience.hostName}</p>
            <p className="text-sm font-medium text-accent">{experience.priceLabel}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState<ExperienceCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExperiences = useMemo(() => {
    return featuredExperiences.filter((exp) => {
      const matchesCategory =
        activeCategory === "all" || exp.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        exp.title.toLowerCase().includes(query) ||
        exp.location.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <AppShell showNav noPadding>
      <div className="px-5">
        <AppHeader />

        <motion.div
          initial="hidden"
          animate="visible"
          className="pb-6"
        >
          <motion.p custom={0} variants={fadeUp} className="text-sm text-ink-muted">
            {getGreeting()},
          </motion.p>
          <motion.h1
            custom={0.05}
            variants={fadeUp}
            className="text-2xl font-bold tracking-tight text-ink"
          >
            Alex
          </motion.h1>

          <motion.div custom={0.1} variants={fadeUp} className="relative mt-6">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search experiences, venues, hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-4",
                "text-sm text-ink placeholder:text-ink-subtle",
                "focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30",
              )}
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        custom={0.15}
        variants={fadeUp}
        className="mb-6 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none"
      >
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "bg-accent text-black"
              : "border border-border bg-surface text-ink-muted hover:border-accent/30",
          )}
        >
          All
        </button>
        {homeCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat.id
                ? "bg-accent text-black"
                : "border border-border bg-surface text-ink-muted hover:border-accent/30",
            )}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      <div className="flex flex-col gap-5 px-5 pb-6">
        {filteredExperiences.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-muted">
            No experiences match your search.
          </p>
        ) : (
          filteredExperiences.map((exp, i) => (
            <ExperienceCard key={exp.id} experience={exp} index={i} />
          ))
        )}
      </div>
    </AppShell>
  );
}

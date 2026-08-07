"use client";

import { Button } from "@/components/ui/Button";
import { onboardingSlides } from "@/features/onboarding/data/slides";
import type { OnboardingSlide } from "@/features/onboarding/data/slides";
import { slideTransition } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  type PanInfo,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const SWIPE_THRESHOLD = 50;

type OnboardingSlideViewProps = {
  slide: OnboardingSlide;
  direction: number;
};

function OnboardingSlideView({ slide, direction }: OnboardingSlideViewProps) {
  return (
    <motion.div
      key={slide.id}
      custom={direction}
      initial={{ opacity: 0, x: direction > 0 ? 80 : -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: direction > 0 ? -80 : 80 }}
      transition={slideTransition}
      className="absolute inset-0 flex flex-col"
    >
      <div className="relative h-[55dvh] w-full overflow-hidden">
        <Image
          src={slide.imageUrl}
          alt={slide.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 512px) 100vw, 512px"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/40"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-accent"
        />
      </div>

      <div className="flex flex-1 flex-col justify-end bg-background px-6 pb-4 pt-8">
        <p className="text-label font-medium text-accent tracking-[0.25em]">
          {slide.id === "access" ? "Step 1" : slide.id === "verified" ? "Step 2" : "Step 3"}
        </p>
        <h2 className="text-balance mt-3 text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">
          {slide.title}
        </h2>
        {slide.subtitle ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            {slide.subtitle}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const isLastSlide = currentIndex === onboardingSlides.length - 1;
  const slide = onboardingSlides[currentIndex];

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex],
  );

  const next = useCallback(() => {
    if (isLastSlide) {
      router.push("/auth");
      return;
    }
    goTo(currentIndex + 1);
  }, [currentIndex, goTo, isLastSlide, router]);

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x < -SWIPE_THRESHOLD && currentIndex < onboardingSlides.length - 1) {
        goTo(currentIndex + 1);
      } else if (info.offset.x > SWIPE_THRESHOLD && currentIndex > 0) {
        goTo(currentIndex - 1);
      }
    },
    [currentIndex, goTo],
  );

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-background shadow-[0_0_80px_rgba(0,0,0,0.8)]">
      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.3em] text-accent transition-colors hover:text-accent-hover"
        >
          Wingman
        </Link>
        {!isLastSlide ? (
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Skip
          </button>
        ) : (
          <span className="w-10" aria-hidden />
        )}
      </header>

      <motion.div
        className="relative flex-1 touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={onDragEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <OnboardingSlideView slide={slide} direction={direction} />
        </AnimatePresence>
      </motion.div>

      <footer className="relative z-20 border-t border-border bg-background px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6">
        <div className="mb-8 flex justify-center gap-2" role="tablist" aria-label="Onboarding progress">
          {onboardingSlides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Slide ${i + 1} of ${onboardingSlides.length}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === currentIndex ? "w-8 bg-accent" : "w-4 bg-border-subtle",
              )}
            />
          ))}
        </div>

        <Button size="lg" fullWidth onClick={next}>
          {isLastSlide ? "Get Started" : "Next"}
        </Button>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already a member?{" "}
          <Link
            href="/auth"
            className="font-medium text-accent underline-offset-2 transition-colors hover:text-accent-hover hover:underline"
          >
            Login
          </Link>
        </p>
      </footer>
    </div>
  );
}

"use client";

import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REDIRECT_DELAY_MS = 2400;

export function SplashScreen() {
  const router = useRouter();
  const reduced = useReducedMotion();

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.replace("/onboarding");
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center overflow-hidden bg-background px-6">
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_30%_35%,rgba(255,43,214,0.16),transparent_58%),radial-gradient(ellipse_50%_40%_at_72%_42%,rgba(0,232,240,0.12),transparent_55%)] ${reduced ? "" : "hero-ambient"}`}
        />

        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: reduced ? 0.3 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <WingmanLogo size={168} />
          <p className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">Wingman</p>
          <p className="mt-2 text-sm text-ink-muted">Miami nights. One host.</p>

          <div className="mt-16 flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-accent"
                animate={reduced ? { opacity: 0.6 } : { opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.15, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

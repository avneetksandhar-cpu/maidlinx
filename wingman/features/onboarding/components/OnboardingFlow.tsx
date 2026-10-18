"use client";

import { WingmanWordmark } from "@/components/brand/WingmanLogo";
import { fadeUpShort } from "@/lib/animations";
import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = fadeUpShort;

export function OnboardingFlow() {
  return (
    <div className="min-h-dvh w-full bg-background-alt">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background lg:max-w-[1080px]">
        <div
          aria-hidden
          className="absolute inset-0 bg-[url('/photos/miami-night.jpg')] bg-cover bg-center"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,15,0.45)_0%,rgba(7,9,15,0.2)_36%,rgba(7,9,15,0.72)_70%,#07090f_100%)]"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          className="relative z-10 flex min-h-dvh flex-col px-7 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(3.25rem,env(safe-area-inset-top))]"
        >
          <motion.div custom={0} variants={fadeUp} className="pt-4">
            <WingmanWordmark logoSize={22} />
          </motion.div>

          <div className="mt-auto max-w-md pb-4">
            <motion.p custom={0.06} variants={fadeUp} className="text-[0.95rem] text-ink-muted">
              Miami
            </motion.p>
            <motion.h1
              custom={0.1}
              variants={fadeUp}
              className="mt-3 font-display text-[3.15rem] leading-[1.02] text-ink"
            >
              Tonight is handled.
            </motion.h1>
            <motion.p custom={0.16} variants={fadeUp} className="mt-4 max-w-[20rem] text-[1rem] leading-relaxed text-ink-muted">
              The best of Miami, through people who know it.
            </motion.p>
            <motion.div custom={0.22} variants={fadeUp} className="mt-8 flex flex-col gap-3">
              <Link href="/booking/location" className="inline-flex h-12 items-center justify-center rounded-[16px] bg-[#00C2FF] px-6 text-[16px] font-medium text-[#050508]">
                Plan my night
              </Link>
              <Link href="/auth" className="inline-flex h-12 items-center justify-center text-[0.95rem] text-ink-muted">
                Sign in
              </Link>
            </motion.div>
            <motion.p custom={0.28} variants={fadeUp} className="mt-8 text-center text-[0.75rem] text-ink-subtle">
              18+ · $500 starts the night with Andres
            </motion.p>
            <p className="mt-3 text-center text-[0.75rem] text-ink-subtle">
              <Link href="/legal/privacy" className="underline-offset-2 hover:underline">
                Privacy
              </Link>
              {" · "}
              <Link href="/legal/terms" className="underline-offset-2 hover:underline">
                Terms
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

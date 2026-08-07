"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REDIRECT_DELAY_MS = 2800;

export function SplashScreen() {
  const router = useRouter();
  const [loadingText, setLoadingText] = useState("Loading");

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.replace("/onboarding");
    }, REDIRECT_DELAY_MS);

    const dotsInterval = setInterval(() => {
      setLoadingText((prev) => {
        if (prev === "Loading...") return "Loading";
        return `${prev}.`;
      });
    }, 400);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(dotsInterval);
    };
  }, [router]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center bg-background px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(201,169,98,0.08),transparent)]"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <div
            aria-hidden
            className="mb-8 h-px w-12 bg-accent"
          />

          <h1 className="text-3xl font-bold uppercase tracking-[0.35em] text-accent">
            Wingman
          </h1>

          <p className="mt-4 text-label text-ink-muted">Private Access</p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 flex flex-col items-center gap-3"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1 w-1 rounded-full bg-accent"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <p className="text-sm text-ink-subtle">{loadingText}</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

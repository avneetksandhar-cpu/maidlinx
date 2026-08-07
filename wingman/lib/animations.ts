import type { Variants } from "framer-motion";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease: luxuryEase },
  }),
};

export const fadeUpShort: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: luxuryEase },
  }),
};

export const slideTransition = {
  duration: 0.45,
  ease: luxuryEase,
} as const;

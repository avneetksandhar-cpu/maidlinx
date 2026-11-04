import type { Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease },
  }),
};

export const fadeUpShort: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease },
  }),
};

export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { duration: 0.35, delay },
  }),
};

export const slideTransition = {
  duration: 0.4,
  ease,
} as const;

export const staggerList = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
} as const;

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease },
  },
};

export const staggerItemReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25 },
  },
};

export function motionOrFade(reduced: boolean | null): Variants {
  return reduced ? fadeOnly : fadeUpShort;
}

export function listItemVariants(reduced: boolean | null): Variants {
  return reduced ? staggerItemReduced : staggerItem;
}

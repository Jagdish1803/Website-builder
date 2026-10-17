"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion, type HTMLMotionProps, type Transition, type Variants } from "motion/react";

/** Shared easing/springs so every animation in the app feels like one system. */
export const ease = [0.22, 1, 0.36, 1] as const;
export const spring: Transition = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } },
};

export const stagger = (step = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

/** Honour the OS "reduce motion" setting everywhere (transforms off, fades kept). */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.4, ease }}>
      {children}
    </MotionConfig>
  );
}

export function FadeIn({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ duration: 0.5, ease, delay }}
      {...props}
    />
  );
}

/** Children using `variants={fadeUp}` animate in one after another. */
export function Stagger({ step, delay, ...props }: HTMLMotionProps<"div"> & { step?: number; delay?: number }) {
  return <motion.div initial="hidden" animate="show" variants={stagger(step, delay)} {...props} />;
}

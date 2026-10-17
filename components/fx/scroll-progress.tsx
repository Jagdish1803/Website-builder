"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin brand-colored bar at the top of the viewport tracking page scroll. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="from-brand fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r via-fuchsia-500 to-sky-500"
      style={{ scaleX }}
    />
  );
}

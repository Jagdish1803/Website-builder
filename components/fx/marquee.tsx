"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/** Infinite horizontal loop. Content is duplicated so the seam is invisible. */
export function Marquee({ children, duration = 30, className }: { children: ReactNode; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      className={cn("relative flex overflow-hidden", className)}
      style={{ maskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)" }}
    >
      <motion.div
        className="flex shrink-0 gap-3 pr-3"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {children}
        <div aria-hidden className="flex gap-3">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

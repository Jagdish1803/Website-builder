"use client";

import { motion } from "motion/react";

import { ease } from "@/components/motion";
import { cn } from "@/lib/utils";

/** Splits text into words that rise out of a blur one after another. */
export function TextReveal({
  text,
  className,
  wordClassName,
  delay = 0,
  step = 0.06,
  highlight,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  step?: number;
  /** Words (exact match) that get the animated gradient treatment. */
  highlight?: string[];
}) {
  const words = text.split(" ");
  return (
    <span className={cn("inline", className)}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className={cn("inline-block", wordClassName)}
            initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease, delay: delay + i * step }}
          >
            {/* background-clip:text breaks on the transformed element itself, so it lives one level in. */}
            {highlight?.includes(word) ? <span className="text-gradient">{word}</span> : word}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

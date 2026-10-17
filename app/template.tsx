"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

import { ease } from "@/components/motion";

// template.tsx remounts on every navigation, so this plays as a page transition.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
      {children}
    </motion.div>
  );
}

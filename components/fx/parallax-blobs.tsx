"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";

/** Hero background: blurred color blobs that drift, parallax on scroll and lean toward the cursor. */
export function ParallaxBlobs() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 600], [0, 160]);
  const y2 = useTransform(scrollY, [0, 600], [0, -120]);
  const y3 = useTransform(scrollY, [0, 600], [0, 80]);
  const fade = useTransform(scrollY, [0, 500], [1, 0.2]);
  const mx = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 });
  const my = useSpring(useMotionValue(0), { stiffness: 40, damping: 20 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 60);
      my.set((e.clientY / window.innerHeight - 0.5) * 40);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ opacity: fade }}>
      <div className="hero-grid absolute inset-0" />
      <motion.div style={{ x: mx, y: my }} className="absolute inset-0">
        {/* Outer element takes the scroll transform; the inner .blob keeps its CSS drift. */}
        <motion.div style={{ y: y1 }} className="absolute top-0 left-[15%]">
          <div className="blob bg-brand relative size-72" />
        </motion.div>
        <motion.div style={{ y: y2 }} className="absolute top-10 right-[12%]">
          <div className="blob relative size-80 bg-fuchsia-400 [animation-delay:-5s]" />
        </motion.div>
        <motion.div style={{ y: y3 }} className="absolute top-40 left-[40%]">
          <div className="blob relative size-64 bg-sky-400 [animation-delay:-9s]" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

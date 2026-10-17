"use client";

import { AnimatePresence, motion } from "motion/react";

import { ease } from "@/components/motion";
import { SiteCard } from "@/components/site-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Site } from "@/lib/types";

export function SiteGrid({
  sites,
  onChange,
  onDelete,
}: {
  sites: Site[];
  onChange: (site: Site) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout" initial>
        {sites.map((s, i) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease, delay: Math.min(i, 8) * 0.05 } }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
          >
            <SiteCard site={s} onChange={onChange} onDelete={onDelete} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export function SiteGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          <Skeleton className="aspect-[16/10] rounded-none" style={{ animationDelay: `${i * 120}ms` }} />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useId } from "react";
import { motion } from "motion/react";

import { spring } from "@/components/motion";
import { cn } from "@/lib/utils";

/** Pill filter whose active background slides between options (shared layout). */
export function Segmented({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count?: number }[];
  label: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("bg-muted inline-flex flex-wrap gap-1 rounded-lg p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "focus-visible:ring-ring/50 relative rounded-md px-3 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px]",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="bg-background absolute inset-0 rounded-md shadow-sm dark:bg-white/10"
                transition={spring}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && <span className="text-muted-foreground text-xs tabular-nums">{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

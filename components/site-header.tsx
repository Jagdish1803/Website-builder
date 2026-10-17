"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LayersIcon, LayoutGridIcon, SparklesIcon, WandSparklesIcon } from "lucide-react";

import { spring } from "@/components/motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Builder", icon: WandSparklesIcon },
  { href: "/sites", label: "Sites", icon: LayoutGridIcon },
  { href: "/compose", label: "Composer", icon: LayersIcon },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 font-semibold">
          <span className="bg-brand text-brand-foreground flex size-7 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            <SparklesIcon className="size-4" />
          </span>
          <span className="hidden sm:inline">Site Rebuilder</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:text-foreground relative flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active && "text-foreground",
                )}
              >
                {active && (
                  <motion.span layoutId="nav-pill" className="bg-accent absolute inset-0 rounded-md" transition={spring} />
                )}
                <Icon className="relative size-4" />
                <span className="relative hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

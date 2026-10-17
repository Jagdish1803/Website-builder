"use client";

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((s) => (
        <SiteCard key={s.id} site={s} onChange={onChange} onDelete={onDelete} />
      ))}
    </div>
  );
}

export function SiteGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

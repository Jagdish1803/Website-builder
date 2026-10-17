"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Site } from "@/lib/types";

export function useSites() {
  const [sites, setSites] = useState<Site[] | null>(null);

  const reload = useCallback(() => {
    api<{ sites: Site[] }>("/api/sites")
      .then((d) => setSites(d.sites))
      .catch(() => {
        setSites([]);
        toast.error("Could not load your sites");
      });
  }, []);

  useEffect(reload, [reload]);

  const replace = (site: Site) => setSites((s) => s?.map((x) => (x.id === site.id ? site : x)) ?? null);
  const remove = (id: string) => setSites((s) => s?.filter((x) => x.id !== id) ?? null);

  return { sites, reload, replace, remove };
}

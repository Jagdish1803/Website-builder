"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LayersIcon,
  Loader2Icon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { DevicePreview } from "@/components/device-preview";
import { SiteGrid, SiteGridSkeleton } from "@/components/site-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCopyLink } from "@/hooks/use-copy";
import { useSites } from "@/hooks/use-sites";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Site } from "@/lib/types";

type BuildResult = {
  site: Site;
  url: string;
  sections: { id: string; type: string; label: string }[];
};

// The build is one long request, so progress is estimated from elapsed time.
const STEPS = [
  { label: "Crawling the page", at: 0 },
  { label: "Extracting content & images", at: 4 },
  { label: "Designing sections with Claude", at: 8 },
  { label: "Saving to your library", at: Infinity },
];

export default function BuilderPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const { sites, reload, replace, remove } = useSites();
  const copy = useCopyLink();

  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  async function build(e: React.FormEvent) {
    e.preventDefault();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api<BuildResult>("/api/build", {
        method: "POST",
        json: { url },
        signal: controller.signal,
      });
      setResult(data);
      reload();
      toast.success("Site rebuilt", { description: `${data.sections.length} sections saved to your library.` });
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Build failed");
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    toast("Build cancelled", { description: "If the server finishes anyway, the site will appear under Sites." });
  }

  const step = STEPS.findLastIndex((s) => elapsed >= s.at);
  const recent = (sites ?? []).slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-3xl space-y-6 pt-4 text-center sm:pt-10">
        <Badge variant="outline" className="gap-1.5 px-3 py-1">
          <WandSparklesIcon className="text-brand" /> Powered by Claude
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Rebuild any website with a better UI
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-lg text-balance">
          Paste a URL. We crawl it, redesign it as reusable sections, and give you a live link — the
          sections land in your library for the Composer.
        </p>

        <form onSubmit={build} className="bg-card mx-auto flex max-w-2xl flex-col gap-2 rounded-xl border p-2 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <GlobeIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              aria-label="Website URL"
              inputMode="url"
              autoComplete="url"
              disabled={loading}
              className="h-11 border-0 pl-9 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          {loading ? (
            <Button type="button" size="lg" variant="outline" className="h-11" onClick={cancel}>
              <XIcon /> Cancel
            </Button>
          ) : (
            <Button type="submit" size="lg" variant="brand" className="h-11" disabled={!url.trim()}>
              Rebuild <ArrowRightIcon />
            </Button>
          )}
        </form>
      </section>

      {loading && (
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Rebuilding {url.replace(/^https?:\/\//, "")}</CardTitle>
            <CardDescription>Usually 30–90 seconds · {elapsed}s elapsed</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.label} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      i < step && "bg-primary text-primary-foreground border-primary",
                      i === step && "border-brand text-brand",
                    )}
                  >
                    {i < step ? (
                      <CheckIcon className="size-3.5" />
                    ) : i === step ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <span className="text-muted-foreground text-xs">{i + 1}</span>
                    )}
                  </span>
                  <span className={cn(i > step && "text-muted-foreground")}>{s.label}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {error && (
        <div
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive mx-auto max-w-2xl rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold">{result.site.title}</h2>
              <p className="text-muted-foreground text-sm">
                {result.sections.length} sections saved to your library
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => copy(result.url)}>
                <CopyIcon /> Copy link
              </Button>
              <Button variant="outline" asChild>
                <a href={`${result.url}?download`}>
                  <DownloadIcon /> Download
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/compose?site=${result.site.id}`}>
                  <LayersIcon /> Edit in Composer
                </Link>
              </Button>
              <Button asChild>
                <a href={result.url} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon /> Open
                </a>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.sections.map((s) => (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="cursor-default">
                    {s.type}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{s.label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <DevicePreview
            src={result.url}
            title="Rebuilt site preview"
            address={typeof window === "undefined" ? result.url : window.location.origin + result.url}
            className="h-[75vh]"
          />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Recent sites</h2>
            <p className="text-muted-foreground text-sm">Your latest rebuilt and composed pages.</p>
          </div>
          {sites && sites.length > 0 && (
            <Button variant="ghost" asChild>
              <Link href="/sites">
                View all {sites.length} <ArrowRightIcon />
              </Link>
            </Button>
          )}
        </div>
        {sites === null ? (
          <SiteGridSkeleton count={3} />
        ) : recent.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
            Nothing built yet — your sites will show up here.
          </p>
        ) : (
          <SiteGrid sites={recent} onChange={replace} onDelete={remove} />
        )}
      </section>
    </div>
  );
}

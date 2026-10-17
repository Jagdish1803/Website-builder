"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BlocksIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LayersIcon,
  Loader2Icon,
  ScanSearchIcon,
  WandSparklesIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { DevicePreview } from "@/components/device-preview";
import { Magnetic } from "@/components/fx/magnetic";
import { Marquee } from "@/components/fx/marquee";
import { NumberTicker } from "@/components/fx/number-ticker";
import { ParallaxBlobs } from "@/components/fx/parallax-blobs";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextReveal } from "@/components/fx/text-reveal";
import { ease, fadeUp, spring, Stagger } from "@/components/motion";
import { SiteGrid, SiteGridSkeleton } from "@/components/site-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCopyLink } from "@/hooks/use-copy";
import { useSites } from "@/hooks/use-sites";
import { api } from "@/lib/api";
import { hostname } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Site } from "@/lib/types";

type BuildResult = {
  site: Site;
  url: string;
  sections: { id: string; type: string; label: string }[];
};

const SECTION_TYPES = ["hero", "services", "pricing", "testimonials", "stats", "faq", "works", "about", "cta", "contact", "footer"];

const FEATURES = [
  { icon: ScanSearchIcon, title: "Crawl & extract", body: "Pulls the real headings, copy, links, prices and images from any public page." },
  { icon: WandSparklesIcon, title: "Redesign with Claude", body: "Rebuilds it as modern, responsive sections with tasteful motion on a shared design system." },
  { icon: BlocksIcon, title: "Mix & match", body: "Every section lands in your library — compose new pages from any site in seconds." },
];

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
  // Eases toward ~95% over ~90s; it never claims "done" before the server does.
  const progress = loading ? Math.min(95, 100 * (1 - Math.exp(-elapsed / 35))) : 0;
  const recent = (sites ?? []).slice(0, 3);
  const stats = [
    { label: "Sites built", value: sites?.length ?? 0 },
    { label: "Sections placed", value: (sites ?? []).reduce((n, s) => n + s.componentIds.length, 0) },
    { label: "Sources", value: new Set((sites ?? []).map((s) => hostname(s.sourceUrl)).filter(Boolean)).size },
  ];

  return (
    <div className="space-y-12">
      <section className="relative isolate -mx-4 -mt-8 overflow-hidden px-4 pt-12 pb-6 sm:-mx-6 sm:-mt-10 sm:px-6 sm:pt-20">
        <ParallaxBlobs />
        <Stagger step={0.09} className="mx-auto max-w-3xl space-y-6 text-center">
        <motion.div variants={fadeUp}>
          <Badge variant="outline" className="bg-background/60 gap-1.5 px-3 py-1 backdrop-blur">
            <WandSparklesIcon className="text-brand" /> Powered by Claude
          </Badge>
        </motion.div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          <TextReveal text="Rebuild any website with a better UI" highlight={["better", "UI"]} delay={0.15} />
        </h1>
        <motion.p variants={fadeUp} className="text-muted-foreground mx-auto max-w-xl text-lg text-balance">
          Paste a URL. We crawl it, redesign it as reusable sections, and give you a live link — the
          sections land in your library for the Composer.
        </motion.p>

        <motion.form
          variants={fadeUp}
          onSubmit={build}
          className={cn(
            "bg-card focus-within:glow-border mx-auto flex max-w-2xl flex-col gap-2 rounded-xl border p-2 shadow-lg shadow-black/5 transition-shadow focus-within:shadow-xl sm:flex-row",
            loading && "glow-border",
          )}
        >
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
            <Magnetic>
              <Button
                type="submit"
                size="lg"
                variant="brand"
                className="group/btn h-11 w-full transition-transform active:scale-95"
                disabled={!url.trim()}
              >
                Rebuild <ArrowRightIcon className="transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Magnetic>
          )}
        </motion.form>
        <motion.div variants={fadeUp} className="pt-2">
          <Marquee duration={28} className="mx-auto max-w-2xl">
            {SECTION_TYPES.map((t) => (
              <span key={t} className="bg-background/60 text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap backdrop-blur">
                {t}
              </span>
            ))}
          </Marquee>
        </motion.div>
        </Stagger>
      </section>

      <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          key="progress"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } }}
          transition={{ duration: 0.4, ease }}
        >
        <Card className="mx-auto max-w-md overflow-hidden">
          <CardHeader>
            <CardTitle>Rebuilding {url.replace(/^https?:\/\//, "")}</CardTitle>
            <CardDescription>Usually 30–90 seconds · {elapsed}s elapsed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-muted relative h-1.5 overflow-hidden rounded-full">
              <motion.div
                className="bg-brand bar-shimmer relative h-full overflow-hidden rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <motion.li
                  key={s.label}
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease }}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-500",
                      i < step && "bg-primary text-primary-foreground border-primary",
                      i === step && "border-brand text-brand",
                    )}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={i < step ? "done" : i === step ? "active" : "todo"}
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={spring}
                        className="flex"
                      >
                        {i < step ? (
                          <CheckIcon className="size-3.5" />
                        ) : i === step ? (
                          <Loader2Icon className="size-3.5 animate-spin" />
                        ) : (
                          <span className="text-muted-foreground text-xs">{i + 1}</span>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className={cn("transition-colors duration-500", i > step && "text-muted-foreground", i === step && "font-medium")}>
                    {s.label}
                  </span>
                </motion.li>
              ))}
            </ol>
          </CardContent>
        </Card>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {error && (
        <motion.div
          key={error}
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          role="alert"
          className="border-destructive/40 bg-destructive/5 text-destructive mx-auto max-w-2xl rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </motion.div>
      )}
      </AnimatePresence>

      {result && (
        <Stagger step={0.08} className="space-y-4">
          <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5">
            {result.sections.map((s, i) => (
              <Tooltip key={s.id}>
                <TooltipTrigger asChild>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring, delay: 0.25 + i * 0.05 }}
                  >
                    <Badge variant="secondary" className="cursor-default">
                      {s.type}
                    </Badge>
                  </motion.span>
                </TooltipTrigger>
                <TooltipContent>{s.label}</TooltipContent>
              </Tooltip>
            ))}
          </motion.div>
          <motion.div variants={fadeUp}>
          <DevicePreview
            src={result.url}
            title="Rebuilt site preview"
            address={typeof window === "undefined" ? result.url : window.location.origin + result.url}
            className="h-[75vh]"
          />
          </motion.div>
        </Stagger>
      )}

      {!loading && !result && (
        <section className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, ease, delay: i * 0.1 }}
            >
              <SpotlightCard tilt className="bg-card h-full rounded-xl border p-6 shadow-sm">
                <motion.div
                  className="bg-brand/10 text-brand mb-4 flex size-10 items-center justify-center rounded-lg"
                  whileHover={{ rotate: [0, -12, 12, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="size-5" />
                </motion.div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">Step {i + 1}</p>
                <h3 className="mb-1.5 font-semibold">{title}</h3>
                <p className="text-muted-foreground text-sm">{body}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </section>
      )}

      {sites && sites.length > 0 && (
        <motion.section
          className="bg-card grid grid-cols-3 divide-x rounded-xl border shadow-sm"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          {stats.map((s) => (
            <div key={s.label} className="px-4 py-5 text-center sm:py-6">
              <NumberTicker value={s.value} className="block text-2xl font-semibold tracking-tight sm:text-4xl" />
              <span className="text-muted-foreground text-xs sm:text-sm">{s.label}</span>
            </div>
          ))}
        </motion.section>
      )}

      <motion.section
        className="space-y-4"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Recent sites</h2>
            <p className="text-muted-foreground text-sm">Your latest rebuilt and composed pages.</p>
          </div>
          {sites && sites.length > 0 && (
            <Button variant="ghost" asChild>
              <Link href="/sites" className="group/all">
                View all {sites.length} <ArrowRightIcon className="transition-transform group-hover/all:translate-x-1" />
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
      </motion.section>
    </div>
  );
}

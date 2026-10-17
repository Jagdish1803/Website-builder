"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyPlusIcon,
  EyeIcon,
  LayersIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  SaveIcon,
  SearchXIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { DevicePreview } from "@/components/device-preview";
import { EmptyState } from "@/components/empty-state";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { PageThumb } from "@/components/page-thumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { hostname, matches, timeAgo } from "@/lib/format";
import type { ComponentMeta, Site } from "@/lib/types";

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "type", label: "By type" },
];

export function Composer() {
  const router = useRouter();
  const editId = useSearchParams().get("site");

  const [comps, setComps] = useState<ComponentMeta[] | null>(null);
  const [editing, setEditing] = useState<Site | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState<"update" | "new" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [inspect, setInspect] = useState<ComponentMeta | null>(null);
  const [deleting, setDeleting] = useState<ComponentMeta | null>(null);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    api<{ components: ComponentMeta[] }>("/api/components")
      .then((d) => setComps(d.components))
      .catch(() => {
        setComps([]);
        toast.error("Could not load the section library");
      });
  }, []);

  useEffect(() => {
    if (!editId) {
      setEditing(null);
      return;
    }
    api<{ site: Site }>(`/api/sites/${editId}`)
      .then(({ site }) => {
        setEditing(site);
        setSelected(site.componentIds);
        setTitle(site.title);
      })
      .catch(() => toast.error("That site no longer exists"));
  }, [editId]);

  const byId = useMemo(() => new Map((comps ?? []).map((c) => [c.id, c])), [comps]);

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of comps ?? []) counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
    return [
      { value: "all", label: "All types" },
      ...[...counts].sort(([a], [b]) => a.localeCompare(b)).map(([t, n]) => ({ value: t, label: `${t} (${n})` })),
    ];
  }, [comps]);

  const sourceOptions = useMemo(() => {
    const hosts = new Set((comps ?? []).map((c) => hostname(c.sourceUrl)).filter(Boolean));
    return [{ value: "all", label: "All sources" }, ...[...hosts].sort().map((h) => ({ value: h, label: h }))];
  }, [comps]);

  const filtered = useMemo(() => {
    const list = (comps ?? [])
      .filter((c) => type === "all" || c.type === type)
      .filter((c) => source === "all" || hostname(c.sourceUrl) === source)
      .filter((c) => matches(query, c.label, c.type, c.sourceUrl));
    if (sort === "oldest") list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sort === "type") list.sort((a, b) => a.type.localeCompare(b.type) || b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [comps, type, source, query, sort]);

  const active = query.trim() !== "" || type !== "all" || source !== "all";
  const clearFilters = () => {
    setQuery("");
    setType("all");
    setSource("all");
  };

  // Only ids that still exist in the library count toward the page.
  const picked = selected.filter((id) => byId.has(id));
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    for (const id of selected) m.set(id, (m.get(id) ?? 0) + 1);
    return m;
  }, [selected]);

  const add = (id: string) => setSelected((s) => [...s, id]);
  const addAll = () => {
    setSelected((s) => [...s, ...filtered.map((c) => c.id)]);
    toast.success(`Added ${filtered.length} sections`);
  };
  const removeAt = (i: number) => setSelected((s) => s.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setSelected((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  function reset() {
    setSelected([]);
    setTitle("");
    if (editId) router.replace("/compose");
  }

  async function save(mode: "update" | "new") {
    setSaving(mode);
    try {
      const data =
        mode === "update" && editing
          ? await api<{ site: Site; url: string }>(`/api/sites/${editing.id}`, {
              method: "PATCH",
              json: { ids: picked, title },
            })
          : await api<{ site: Site; url: string }>("/api/sites", {
              method: "POST",
              json: { ids: picked, title },
            });
      setEditing(data.site);
      if (data.site.id !== editId) router.replace(`/compose?site=${data.site.id}`);
      toast.success(mode === "update" ? "Site updated" : "Site created", {
        description: data.site.title,
        action: { label: "Open", onClick: () => window.open(data.url, "_blank") },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function deleteComponent(c: ComponentMeta) {
    try {
      await api(`/api/components/${c.id}`, { method: "DELETE" });
      setComps((list) => list?.filter((x) => x.id !== c.id) ?? null);
      setSelected((s) => s.filter((id) => id !== c.id));
      toast.success("Section deleted", { description: "Sites that used it will skip it." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const previewSrc = `/preview?ids=${picked.join(",")}&title=${encodeURIComponent(title || "Preview")}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? `Editing “${editing.title}”` : "Composer"}
        description={
          editing ? (
            <>
              Reorder, add or remove sections, then update the live page at{" "}
              <a href={`/s/${editing.id}`} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
                /s/{editing.id}
              </a>
              .
            </>
          ) : (
            "Mix & match saved sections from any rebuilt site into a new page. No AI call — it just assembles what you pick."
          )
        }
        actions={
          editing && (
            <Button variant="outline" onClick={reset}>
              <PlusIcon /> New page
            </Button>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Library */}
        <section className="space-y-4" aria-label="Section library">
          {comps === null ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          ) : comps.length === 0 ? (
            <EmptyState
              icon={LayersIcon}
              title="Your library is empty"
              description="Rebuild a site and its sections will appear here, ready to mix & match."
              action={
                <Button asChild>
                  <Link href="/">Rebuild a site</Link>
                </Button>
              }
            />
          ) : (
            <>
              <FilterBar count={filtered.length} total={comps.length} noun="section" active={active} onClear={clearFilters}>
                <FilterSearch value={query} onChange={setQuery} placeholder="Search sections…" />
                <FilterSelect value={type} onChange={setType} options={typeOptions} label="Type" />
                <FilterSelect value={source} onChange={setSource} options={sourceOptions} label="Source" />
                <FilterSelect value={sort} onChange={setSort} options={SORTS} label="Sort" className="w-full sm:w-36" />
                {active && filtered.length > 0 && (
                  <Button variant="outline" onClick={addAll}>
                    <CopyPlusIcon /> Add all {filtered.length}
                  </Button>
                )}
              </FilterBar>

              {filtered.length === 0 ? (
                <EmptyState
                  icon={SearchXIcon}
                  title="No sections match these filters"
                  action={
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((c) => {
                    const used = usage.get(c.id) ?? 0;
                    return (
                      <Card key={c.id} className="group gap-0 overflow-hidden py-0">
                        <button
                          type="button"
                          onClick={() => setInspect(c)}
                          className="relative block border-b text-left"
                          aria-label={`Preview ${c.label}`}
                        >
                          <PageThumb src={`/c/${c.id}`} title={c.label} scale={0.2} />
                          <span className="bg-background/0 group-hover:bg-background/40 absolute inset-0 flex items-center justify-center transition-colors">
                            <span className="bg-background flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                              <EyeIcon className="size-3.5" /> Preview
                            </span>
                          </span>
                          {used > 0 && (
                            <Badge className="absolute top-2 right-2">On page{used > 1 ? ` ×${used}` : ""}</Badge>
                          )}
                        </button>
                        <div className="flex items-start gap-2 p-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary">{c.type}</Badge>
                              <span className="text-muted-foreground truncate text-xs">{hostname(c.sourceUrl)}</span>
                            </div>
                            <p className="line-clamp-2 text-sm font-medium" title={c.label}>
                              {c.label}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button size="icon-sm" variant="outline" aria-label={`Add ${c.label}`} onClick={() => add(c.id)}>
                              <PlusIcon />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon-sm" variant="ghost" aria-label="Section actions">
                                  <MoreHorizontalIcon />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setInspect(c)}>
                                  <EyeIcon /> Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(c)}>
                                  <Trash2Icon /> Delete from library
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>

        {/* Page outline */}
        <Card className="gap-4 lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Your page</CardTitle>
            <CardDescription>
              {picked.length === 0 ? "Add sections from the library." : `${picked.length} section${picked.length === 1 ? "" : "s"}, top to bottom.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-title">Page title</Label>
              <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Composed page" />
            </div>
            {selected.length > 0 && (
              <ol className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
                {selected.map((id, i) => {
                  const c = byId.get(id);
                  return (
                    <li key={`${id}-${i}`} className="bg-muted/40 flex items-center gap-2 rounded-lg border p-2 text-sm">
                      <span className="text-muted-foreground w-5 shrink-0 text-center text-xs tabular-nums">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        {c ? (
                          <>
                            <p className="truncate font-medium">{c.label}</p>
                            <p className="text-muted-foreground truncate text-xs">
                              {c.type} · {hostname(c.sourceUrl)}
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground truncate italic">Missing section</p>
                        )}
                      </div>
                      <div className="flex shrink-0">
                        <Button size="icon-sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUpIcon />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Move down"
                          disabled={i === selected.length - 1}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDownIcon />
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Remove" onClick={() => removeAt(i)}>
                          <XIcon />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full" variant="outline" disabled={picked.length === 0} onClick={() => setPreviewOpen(true)}>
              <EyeIcon /> Preview page
            </Button>
            {editing ? (
              <div className="grid w-full grid-cols-2 gap-2">
                <Button variant="secondary" disabled={picked.length === 0 || saving !== null} onClick={() => save("new")}>
                  {saving === "new" ? <Loader2Icon className="animate-spin" /> : <CopyPlusIcon />} Save as new
                </Button>
                <Button disabled={picked.length === 0 || saving !== null} onClick={() => save("update")}>
                  {saving === "update" ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} Update
                </Button>
              </div>
            ) : (
              <Button className="w-full" disabled={picked.length === 0 || saving !== null} onClick={() => save("new")}>
                {saving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />} Save page
              </Button>
            )}
            {selected.length > 0 && (
              <Button variant="ghost" size="sm" className="text-muted-foreground w-full" onClick={() => setSelected([])}>
                Clear all sections
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Whole-page preview */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[90vh] flex-col gap-3 p-4 sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{title || "Composed page"}</DialogTitle>
            <DialogDescription>Unsaved preview · {picked.length} sections</DialogDescription>
          </DialogHeader>
          {previewOpen && <DevicePreview src={previewSrc} title="Page preview" address="Preview (not saved)" className="min-h-0 flex-1" />}
        </DialogContent>
      </Dialog>

      {/* Single-section preview */}
      <Dialog open={inspect !== null} onOpenChange={(o) => !o && setInspect(null)}>
        <DialogContent className="flex h-[85vh] flex-col gap-3 p-4 sm:max-w-5xl">
          {inspect && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge variant="secondary">{inspect.type}</Badge> {inspect.label}
                </DialogTitle>
                <DialogDescription>
                  From {hostname(inspect.sourceUrl)} · {timeAgo(inspect.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <DevicePreview
                src={`/c/${inspect.id}`}
                title={inspect.label}
                className="min-h-0 flex-1"
                actions={
                  <Button
                    size="sm"
                    onClick={() => {
                      add(inspect.id);
                      toast.success("Added to page", { description: inspect.label });
                    }}
                  >
                    <PlusIcon /> Add
                  </Button>
                }
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.label}” is removed from the library, and any site that uses it will no longer
              show it. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => deleting && deleteComponent(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

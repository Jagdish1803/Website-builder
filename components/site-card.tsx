"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

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
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PageThumb } from "@/components/page-thumb";
import { useCopyLink } from "@/hooks/use-copy";
import { api } from "@/lib/api";
import { hostname, timeAgo } from "@/lib/format";
import type { Site } from "@/lib/types";

export function SiteCard({
  site,
  onChange,
  onDelete,
}: {
  site: Site;
  onChange: (site: Site) => void;
  onDelete: (id: string) => void;
}) {
  const copy = useCopyLink();
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(site.title);
  const href = `/s/${site.id}`;

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await api<{ site: Site }>(`/api/sites/${site.id}`, { method: "PATCH", json: { title } });
      onChange(data.site);
      setRenaming(false);
      toast.success("Site renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    }
  }

  async function remove() {
    try {
      await api(`/api/sites/${site.id}`, { method: "DELETE" });
      onDelete(site.id);
      toast.success("Site deleted", { description: "Its sections are still in your library." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Card className="group hover:border-foreground/20 h-full gap-0 overflow-hidden py-0 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:shadow-xl motion-reduce:hover:translate-y-0">
      <a href={href} target="_blank" rel="noreferrer" className="relative block overflow-hidden border-b" aria-label={`Open ${site.title}`}>
        <PageThumb
          src={href}
          title={site.title}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
        />
        <span className="bg-background/90 absolute right-3 bottom-3 flex translate-y-2 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium opacity-0 shadow-sm backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ExternalLinkIcon className="size-3" /> Open
        </span>
      </a>
      <div className="flex items-start gap-2 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate font-medium" title={site.title}>
            {site.title}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={site.kind === "rebuild" ? "secondary" : "outline"}>
              {site.kind === "rebuild" ? "Rebuilt" : "Composed"}
            </Badge>
            <Badge variant="outline">
              {site.componentIds.length} section{site.componentIds.length === 1 ? "" : "s"}
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {site.sourceUrl ? hostname(site.sourceUrl) + " · " : ""}
            {timeAgo(site.updatedAt ?? site.createdAt)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Site actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <a href={href} target="_blank" rel="noreferrer">
                <ExternalLinkIcon /> Open
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => copy(href)}>
              <CopyIcon /> Copy link
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`${href}?download`}>
                <DownloadIcon /> Download HTML
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/compose?site=${site.id}`}>
                <LayersIcon /> Edit in Composer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRenaming(true)}>
              <PencilIcon /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
              <Trash2Icon /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <form onSubmit={rename} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename site</DialogTitle>
              <DialogDescription>Also used as the page&apos;s &lt;title&gt;.</DialogDescription>
            </DialogHeader>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus aria-label="Site title" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenaming(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{site.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The page and its link stop working. Its sections stay in your library so you can still
              compose with them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={remove}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

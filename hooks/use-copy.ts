"use client";

import { toast } from "sonner";

/** Copy a site path (e.g. "/s/abc") as an absolute link. */
export function useCopyLink() {
  return (path: string) => {
    const link = window.location.origin + path;
    navigator.clipboard.writeText(link).then(
      () => toast.success("Link copied", { description: link }),
      () => toast.error("Could not copy the link"),
    );
  };
}

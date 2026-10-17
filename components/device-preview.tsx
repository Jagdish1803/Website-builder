"use client";

import { useState, type ReactNode } from "react";
import { MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const WIDTHS = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;
type Device = keyof typeof WIDTHS;

/** Browser-chrome framed iframe with a desktop / tablet / mobile width switch. */
export function DevicePreview({
  src,
  title,
  address,
  actions,
  className,
}: {
  src: string;
  title: string;
  address?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  return (
    <div className={cn("bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <div className="hidden gap-1.5 sm:flex" aria-hidden>
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-yellow-400/80" />
          <span className="size-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="bg-muted text-muted-foreground min-w-0 flex-1 truncate rounded-md px-3 py-1 font-mono text-xs">
          {address ?? src}
        </div>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={device}
          onValueChange={(v) => v && setDevice(v as Device)}
          aria-label="Preview width"
        >
          <ToggleGroupItem value="desktop" aria-label="Desktop">
            <MonitorIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="tablet" aria-label="Tablet">
            <TabletIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" aria-label="Mobile">
            <SmartphoneIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        {actions}
      </div>
      <div className="bg-muted/50 flex flex-1 justify-center overflow-hidden">
        <iframe
          key={src}
          src={src}
          title={title}
          className="h-full min-h-[560px] border-0 bg-white transition-[width] duration-300"
          style={{ width: WIDTHS[device], maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}

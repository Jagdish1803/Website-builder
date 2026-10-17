"use client";

import type { ReactNode } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

export function FilterSearch({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 basis-56">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  label: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={className ?? "w-full sm:w-40"}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Row of filter controls + result count + "clear" when anything is active. */
export function FilterBar({
  children,
  count,
  total,
  noun,
  active,
  onClear,
}: {
  children: ReactNode;
  count: number;
  total: number;
  noun: string;
  active: boolean;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <div className="text-muted-foreground flex h-7 items-center gap-2 text-sm">
        <span>
          {active ? `${count} of ${total}` : total} {noun}
          {(active ? count : total) === 1 ? "" : "s"}
        </span>
        {active && (
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onClear}>
            <XIcon /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

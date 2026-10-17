import { cn } from "@/lib/utils";

/**
 * A live, non-interactive thumbnail of a rendered page. The iframe is laid out at
 * desktop width and scaled down, so sections render at their real breakpoints.
 */
export function PageThumb({
  src,
  title,
  scale = 0.25,
  className,
}: {
  src: string;
  title: string;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={cn("bg-muted relative aspect-[16/10] overflow-hidden", className)}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 origin-top-left border-0 bg-white"
        style={{ width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})` }}
      />
    </div>
  );
}

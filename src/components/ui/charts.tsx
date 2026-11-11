import { cn } from "@/lib/utils";

/**
 * Minimal single-series charts (one hue: brand-600 marks on white, ≥3:1 contrast).
 * Values are in text ink, not series color; each bar has a hover tooltip + aria-label,
 * and only the max bar is direct-labeled.
 */
export function ColumnChart({ data, format, height = 180, className }: {
  data: { label: string; value: number; hint?: string }[];
  format: (v: number) => string;
  height?: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const maxIdx = data.findIndex((d) => d.value === max);
  return (
    <figure className={cn("w-full", className)}>
      <div className="relative flex items-end gap-2 border-b border-line" style={{ height }} role="list">
        {[0.25, 0.5, 0.75].map((g) => (
          <span key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-stone-100" style={{ bottom: `${g * 100}%` }} />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          return (
            <div key={d.label} role="listitem" aria-label={`${d.label}: ${format(d.value)}`} className="group relative flex h-full flex-1 items-end justify-center">
              {i === maxIdx && d.value > 0 && (
                <span className="absolute text-[11px] font-semibold tabular-nums text-stone-700" style={{ bottom: `calc(${h}% + 4px)` }}>{format(d.value)}</span>
              )}
              <div className="w-full max-w-10 rounded-t-[4px] bg-brand-600 transition group-hover:bg-brand-700" style={{ height: `${Math.max(h, d.value ? 2 : 0)}%` }} />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lift group-hover:block">
                <p className="font-semibold">{d.label}</p>
                <p className="tabular-nums">{format(d.value)}{d.hint ? ` · ${d.hint}` : ""}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => <span key={d.label} className="flex-1 text-center text-[11px] text-muted">{d.label}</span>)}
      </div>
    </figure>
  );
}

export function BarList({ data, format }: { data: { label: string; value: number; sub?: string }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="group" title={`${d.label}: ${format(d.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-ink">{d.label}</span>
            <span className="shrink-0 tabular-nums text-stone-600">{format(d.value)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-brand-600 transition group-hover:bg-brand-700" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          {d.sub && <p className="mt-0.5 text-xs text-muted">{d.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

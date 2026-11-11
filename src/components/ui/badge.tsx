import type { ReactNode } from "react";
import { cn, type Tone } from "@/lib/utils";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200/70",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  amber: "bg-amber-50 text-amber-700 ring-amber-200/70",
  rose: "bg-rose-50 text-rose-700 ring-rose-200/70",
  sky: "bg-sky-50 text-sky-700 ring-sky-200/70",
  violet: "bg-violet-50 text-violet-700 ring-violet-200/70",
  stone: "bg-stone-100 text-stone-600 ring-stone-200/70",
  trail: "bg-trail-50 text-trail-700 ring-trail-100",
};

export function Badge({ tone = "stone", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

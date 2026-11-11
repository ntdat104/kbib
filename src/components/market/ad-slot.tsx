import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db";
import { pickAd } from "@/lib/services/ads";
import type { AdPlacement, RaceType } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function AdSlot({ placement, target = "all", variant = "banner", className }: { placement: AdPlacement; target?: RaceType | "all"; variant?: "banner" | "card"; className?: string }) {
  const ad = await pickAd(placement, target);
  if (!ad) return null;
  const brand = await db.users.get(ad.brandId);
  return (
    <a
      href={`/api/ads/${ad.id}`}
      target="_blank"
      rel="sponsored noopener"
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-brand-50 to-brand-100/70 transition hover:shadow-lift",
        variant === "banner" ? "p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6" : "p-5",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-600">Tài trợ · {brand?.orgName}</p>
        <p className="mt-1 font-bold text-ink">{ad.title}</p>
        {ad.body && <p className="mt-1 text-sm text-stone-600">{ad.body}</p>}
      </div>
      <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-white transition group-hover:bg-brand-700", variant === "banner" ? "mt-4 sm:mt-0" : "mt-4")}>
        {ad.cta}
        <ArrowUpRight className="size-4" />
      </span>
    </a>
  );
}

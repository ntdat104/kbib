import Link from "next/link";
import { BadgeCheck, Package, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ListingView } from "@/lib/services/catalog";
import { cn, formatDate } from "@/lib/utils";
import { HotBadge, PriceTag, TrustLine, TypeBadge } from "./bits";

const KIND = {
  official: { label: "Suất chính thức BTC", tone: "emerald" as const },
  consignment: { label: "KBIB bán hộ", tone: "violet" as const },
  resale: null,
};

export function ListingRow({ l, showRace = false }: { l: ListingView; showRace?: boolean }) {
  const kind = KIND[l.kind];
  return (
    <Link
      href={`/listings/${l.id}`}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border bg-white p-4 transition hover:border-brand-300 hover:shadow-lift sm:flex-row sm:items-center",
        l.promoted ? "border-brand-200 ring-1 ring-brand-100" : "border-line",
      )}
    >
      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-center">
        <span className="text-sm font-extrabold leading-none text-brand-700">{l.distance.name}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {showRace && <span className="mr-1 font-semibold text-ink group-hover:text-brand-700">{l.race.name}</span>}
          {l.promoted && <HotBadge />}
          {kind && <Badge tone={kind.tone}>{kind.label}</Badge>}
          {l.includesKit && <Badge icon={<Package className="size-3" />}>Kèm race kit</Badge>}
          {l.quantity > 1 && <Badge tone="emerald">Còn {l.quantity} suất</Badge>}
        </div>
        {showRace && <p className="mt-0.5 text-xs text-muted">{formatDate(l.race.date)} · {l.race.city}</p>}
        <div className="mt-1.5">
          <TrustLine name={l.seller.name} verified={l.seller.verified} trustScore={l.seller.trustScore} sales={l.seller.sales} rating={l.seller.rating} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <PriceTag price={l.price} original={l.originalPrice} />
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <ShieldCheck className="size-3.5" />
          Escrow
        </span>
      </div>
    </Link>
  );
}

export function ListingTile({ l }: { l: ListingView }) {
  return (
    <Link href={`/listings/${l.id}`} className="group card flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-ink group-hover:text-brand-700">{l.race.name}</p>
          <p className="text-xs text-muted">{formatDate(l.race.date)} · {l.race.city}</p>
        </div>
        <TypeBadge type={l.race.type} />
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-lg bg-brand-50 px-2 py-1 text-sm font-extrabold text-brand-700">{l.distance.name}</span>
        {l.promoted && <Sparkles className="size-4 text-brand-500" aria-label="Nổi bật" />}
        {l.kind === "official" && <BadgeCheck className="size-4 text-emerald-600" aria-label="Chính thức" />}
      </div>
      <div className="mt-auto flex items-end justify-between">
        <PriceTag price={l.price} original={l.originalPrice} />
      </div>
    </Link>
  );
}

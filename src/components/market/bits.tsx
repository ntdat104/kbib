import { BadgeCheck, Flame, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus, RaceType } from "@/lib/types";
import { cn, formatVND, ORDER_STATUS, TYPE_LABEL } from "@/lib/utils";

export function TypeBadge({ type }: { type: RaceType }) {
  return <Badge tone={type === "trail" ? "trail" : "brand"}>{TYPE_LABEL[type]}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function PriceTag({ price, original, size = "md" }: { price: number; original: number; size?: "md" | "lg" }) {
  const diff = original ? Math.round(((price - original) / original) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-bold tabular-nums text-ink", size === "lg" ? "text-3xl tracking-tight" : "text-lg")}>{formatVND(price)}</span>
      {original > 0 && price !== original && <span className="text-xs text-muted line-through tabular-nums">{formatVND(original)}</span>}
      {diff !== 0 && (
        <span className={cn("text-xs font-semibold tabular-nums", diff < 0 ? "text-emerald-600" : "text-brand-700")}>
          {diff > 0 ? "+" : ""}
          {diff}%
        </span>
      )}
    </div>
  );
}

export function TrustLine({ name, verified, trustScore, sales, rating }: { name: string; verified: boolean; trustScore: number; sales: number; rating: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1 font-medium text-stone-700">
        {name}
        {verified && <BadgeCheck className="size-3.5 text-sky-500" aria-label="Đã xác minh" />}
      </span>
      <span className="inline-flex items-center gap-1">
        <ShieldCheck className="size-3.5 text-emerald-600" />
        Uy tín {trustScore}
      </span>
      {sales > 0 && <span>{sales} giao dịch</span>}
      {rating > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function HotBadge() {
  return (
    <Badge tone="brand" icon={<Flame className="size-3" />}>
      Nổi bật
    </Badge>
  );
}

import { db } from "@/lib/db";

/**
 * Batched counters (listing views, ad impressions). Increments accumulate in memory and are
 * flushed once a minute — one sheet write per row per minute instead of one per page view.
 */
type Key = `${"listings" | "ad_campaigns"}:${string}`;
const g = globalThis as unknown as { __kbibCounters?: Map<Key, number>; __kbibCounterTimer?: NodeJS.Timeout };
const pending = (g.__kbibCounters ??= new Map());

export function bump(table: "listings" | "ad_campaigns", id: string, n = 1) {
  const k: Key = `${table}:${id}`;
  pending.set(k, (pending.get(k) ?? 0) + n);
}

export async function flushCounters() {
  const entries = [...pending.entries()];
  pending.clear();
  for (const [k, n] of entries) {
    const [table, id] = k.split(":") as ["listings" | "ad_campaigns", string];
    if (table === "listings") {
      const l = await db.listings.get(id);
      if (l) await db.listings.update(id, { views: l.views + n });
    } else {
      const c = await db.ad_campaigns.get(id);
      if (c) await db.ad_campaigns.update(id, { impressions: c.impressions + n });
    }
  }
}

if (!g.__kbibCounterTimer) {
  g.__kbibCounterTimer = setInterval(() => void flushCounters().catch(() => {}), 60000);
  g.__kbibCounterTimer.unref?.();
}

import { db } from "@/lib/db";
import type { AdCampaign, AdPlacement, RaceType } from "@/lib/types";
import { bump } from "./counters";

export async function pickAd(placement: AdPlacement, target: RaceType | "all" = "all"): Promise<AdCampaign | null> {
  const now = new Date().toISOString();
  const ads = await db.ad_campaigns.where(
    (a) =>
      a.status === "active" &&
      a.placement === placement &&
      a.startAt <= now &&
      a.endAt >= now &&
      (a.target === "all" || target === "all" || a.target === target),
  );
  if (!ads.length) return null;
  // Weighted by remaining budget so bigger campaigns serve more often.
  const total = ads.reduce((s, a) => s + Math.max(1, a.budget), 0);
  let r = Math.random() * total;
  const ad = ads.find((a) => (r -= Math.max(1, a.budget)) <= 0) ?? ads[0];
  bump("ad_campaigns", ad.id);
  return ad;
}

export async function trackClick(id: string) {
  const c = await db.ad_campaigns.get(id);
  if (!c) return null;
  await db.ad_campaigns.update(id, { clicks: c.clicks + 1 });
  return c.link;
}

import { after } from "next/server";

/**
 * Ops notifications to Discord via incoming webhook (DISCORD_WEBHOOK_URL).
 * Optional DISCORD_WEBHOOK_URL_ALERTS routes risk events (disputes, fraud, failed transfers) to a
 * separate channel. Messages are queued and sent ~1 per 2.1s to respect Discord's webhook rate
 * limit (5 req / 2s, 30 / min); a 429 is retried after `retry_after`. Never blocks the request.
 * PII (CCCD, phone, DOB) is never sent.
 */
export type DiscordEvent =
  | "order_paid" | "transfer_approved" | "order_completed" | "dispute_opened" | "dispute_resolved"
  | "fraud_flag" | "user_registered" | "consignment_new" | "campaign_submitted" | "promotion"
  | "data_subscription" | "listing_official" | "payout_batch";

const STYLE: Record<DiscordEvent, { emoji: string; color: number; alert?: boolean }> = {
  order_paid: { emoji: "💰", color: 0xff6a13 },
  transfer_approved: { emoji: "🪪", color: 0x0ea5e9 },
  order_completed: { emoji: "✅", color: 0x16a34a },
  dispute_opened: { emoji: "⚠️", color: 0xe11d48, alert: true },
  dispute_resolved: { emoji: "⚖️", color: 0x78716c, alert: true },
  fraud_flag: { emoji: "🚨", color: 0xdc2626, alert: true },
  user_registered: { emoji: "👋", color: 0xffb070 },
  consignment_new: { emoji: "🤝", color: 0x8b5cf6 },
  campaign_submitted: { emoji: "📣", color: 0xf59e0b },
  promotion: { emoji: "🚀", color: 0xff8a3d },
  data_subscription: { emoji: "📊", color: 0x0284c7 },
  listing_official: { emoji: "🎟️", color: 0x15803d },
  payout_batch: { emoji: "🏦", color: 0x57534e },
};

interface Embed {
  title: string;
  description?: string;
  url?: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp: string;
  footer: { text: string };
}

type Job = { url: string; embed: Embed };
const g = globalThis as unknown as { __kbibDiscord?: { queue: Job[]; draining: Promise<void> | null } };
const state = (g.__kbibDiscord ??= { queue: [], draining: null });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function post(job: Job) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(job.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "KBIB Bot", embeds: [job.embed], allowed_mentions: { parse: [] } }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
      await sleep(Math.ceil((body.retry_after ?? 2) * 1000));
      continue;
    }
    if (!res.ok) console.warn(`[discord] ${res.status} ${await res.text().catch(() => "")}`);
    return;
  }
}

function drain() {
  state.draining ??= (async () => {
    while (state.queue.length) {
      const job = state.queue.shift()!;
      await post(job).catch((e) => console.warn("[discord]", e?.message ?? e));
      if (state.queue.length) await sleep(2100);
    }
  })().finally(() => (state.draining = null));
  return state.draining;
}

export function discord(
  event: DiscordEvent,
  title: string,
  opts: { description?: string; fields?: Record<string, string | number>; link?: string } = {},
) {
  const style = STYLE[event];
  const url = (style.alert && process.env.DISCORD_WEBHOOK_URL_ALERTS) || process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  state.queue.push({
    url,
    embed: {
      title: `${style.emoji} ${title}`.slice(0, 256),
      description: opts.description?.slice(0, 2000),
      url: opts.link ? `${base}${opts.link}` : undefined,
      color: style.color,
      fields: Object.entries(opts.fields ?? {}).slice(0, 10).map(([name, value]) => ({ name, value: String(value).slice(0, 1024) || "—", inline: true })),
      timestamp: new Date().toISOString(),
      footer: { text: `KBIB · ${event}` },
    },
  });
  // In a request, keep the function alive until sent (serverless-safe); elsewhere just drain.
  try {
    after(drain);
  } catch {
    void drain();
  }
}

/** Await all queued messages (scripts / tests). */
export async function flushDiscord() {
  await drain();
}

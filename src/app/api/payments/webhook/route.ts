import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { markPaid } from "@/lib/services/orders";

/**
 * Bank / payment-gateway webhook (Casso, PayOS, SePay… style).
 * Body: { transactions: [{ id, amount, description }] } signed with HMAC-SHA256 of the raw body
 * in header `x-signature` using PAYMENT_WEBHOOK_SECRET. Order code is matched in the description.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook disabled" }, { status: 503 });
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const got = req.headers.get("x-signature") ?? "";
  if (got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected)))
    return NextResponse.json({ error: "bad signature" }, { status: 401 });

  const body = JSON.parse(raw) as { transactions?: { id: string; amount: number; description: string }[] };
  const results = [];
  for (const tx of body.transactions ?? []) {
    const code = tx.description.toUpperCase().match(/KB[0-9A-Z]{6,12}/)?.[0];
    const order = code ? await db.orders.find((o) => o.code === code) : null;
    if (!order) { results.push({ tx: tx.id, status: "unmatched" }); continue; }
    if (tx.amount < order.total) { results.push({ tx: tx.id, status: "underpaid" }); continue; }
    await markPaid(order.id, "vietqr", tx.id);
    results.push({ tx: tx.id, order: order.code, status: "paid" });
  }
  return NextResponse.json({ ok: true, results });
}

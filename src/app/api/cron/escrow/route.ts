import { NextResponse, type NextRequest } from "next/server";
import { autoCompleteOrders, expireUnpaidOrders } from "@/lib/services/orders";
import { flushCounters } from "@/lib/services/counters";

/** Schedule every 5–15 min (Vercel Cron / Cloud Scheduler). Protected by CRON_SECRET. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await expireUnpaidOrders();
  const completed = await autoCompleteOrders();
  await flushCounters();
  return NextResponse.json({ ok: true, autoCompleted: completed });
}

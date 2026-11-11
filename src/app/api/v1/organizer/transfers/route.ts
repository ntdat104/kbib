import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { approveTransfer, DomainError, rejectTransfer } from "@/lib/services/orders";

async function organizerFrom(req: NextRequest) {
  const key = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!key) return null;
  return db.users.find((u) => u.role === "organizer" && u.status === "active" && u.apiKey === key);
}

export async function GET(req: NextRequest) {
  const org = await organizerFrom(req);
  if (!org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const status = req.nextUrl.searchParams.get("status");
  const races = new Set((await db.races.where((r) => r.organizerId === org.id)).map((r) => r.id));
  const data = (await db.transfers.where((t) => races.has(t.raceId) && (!status || t.status === status))).map((t) => ({
    id: t.id, raceId: t.raceId, distanceId: t.distanceId, status: t.status, runner: t.runnerInfo, organizerFee: t.organizerFee,
    newBibCode: t.newBibCode, createdAt: t.createdAt, handledAt: t.handledAt,
  }));
  return NextResponse.json({ data });
}

const body = z.object({ transferId: z.string(), action: z.enum(["approve", "reject"]), bibCode: z.string().optional(), reason: z.string().optional() });

export async function POST(req: NextRequest) {
  const org = await organizerFrom(req);
  if (!org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  try {
    const { transferId, action, bibCode, reason } = parsed.data;
    if (action === "approve") await approveTransfer(transferId, org, bibCode ?? "");
    else await rejectTransfer(transferId, org, reason ?? "Rejected via API");
    return NextResponse.json({ ok: true, transfer: await db.transfers.get(transferId) });
  } catch (e) {
    if (e instanceof DomainError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }
}

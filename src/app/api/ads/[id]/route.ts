import { NextResponse, type NextRequest } from "next/server";
import { trackClick } from "@/lib/services/ads";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/ads/[id]">) {
  const { id } = await ctx.params;
  const link = await trackClick(id);
  return NextResponse.redirect(link && /^https?:\/\//.test(link) ? link : new URL("/", req.url));
}

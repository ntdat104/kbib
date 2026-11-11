import "server-only";
import { z } from "zod";
import type { ActionState } from "@/components/ui/form";
import { DomainError } from "@/lib/services/orders";

export async function guard(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    if (e instanceof DomainError) return { error: e.message };
    if (e instanceof z.ZodError) return { error: e.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
    // Let Next.js redirect()/notFound() propagate.
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error(e);
    return { error: "Có lỗi xảy ra, vui lòng thử lại." };
  }
}

export const money = z.coerce.number({ message: "Giá không hợp lệ" }).int().min(0);
export const str = (max = 500) => z.string().trim().max(max);

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/ui/form";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth/session";
import { db, newId } from "@/lib/db";
import { discord } from "@/lib/services/discord";
import { notify } from "@/lib/services/notify";
import type { Role } from "@/lib/types";
import { nowIso, ROLE_HOME } from "@/lib/utils";
import { guard } from "./helpers";

function safeNext(next: unknown, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = String(fd.get("email") ?? "").toLowerCase().trim();
  const password = String(fd.get("password") ?? "");
  const user = await db.users.find((u) => u.email === email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Email hoặc mật khẩu không đúng" };
  if (user.status !== "active") return { error: "Tài khoản đang bị tạm khoá. Liên hệ hỗ trợ." };
  (await cookies()).set(SESSION_COOKIE, await signSession({ uid: user.id, role: user.role }), sessionCookieOptions);
  redirect(safeNext(fd.get("next"), ROLE_HOME[user.role]));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nhập họ tên"),
  email: z.email("Email không hợp lệ").transform((s) => s.toLowerCase().trim()),
  phone: z.string().trim().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  role: z.enum(["runner", "agent", "broker", "organizer", "brand", "partner"]).default("runner"),
  orgName: z.string().trim().max(120).optional().default(""),
  ref: z.string().trim().max(20).optional().default(""),
});

export async function registerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  let role: Role = "runner";
  const res = await guard(async () => {
    const input = registerSchema.parse(Object.fromEntries(fd));
    if (await db.users.find((u) => u.email === input.email)) return { error: "Email đã được đăng ký" };
    if (input.role !== "runner" && !input.orgName && ["organizer", "brand", "partner"].includes(input.role))
      return { error: "Vui lòng nhập tên tổ chức / doanh nghiệp" };
    role = input.role;
    const ref = input.ref.toUpperCase();
    const agent = ref ? await db.users.find((u) => u.referralCode === ref && u.role === "agent") : null;
    const user = await db.users.insert({
      id: newId("usr"),
      email: input.email,
      passwordHash: await hashPassword(input.password),
      name: input.name,
      phone: input.phone,
      role,
      status: "active",
      orgName: input.orgName,
      referralCode: role === "agent" ? `AG${Math.random().toString(36).slice(2, 6).toUpperCase()}` : "",
      apiKey: role === "organizer" ? `kbib_org_${crypto.randomUUID().replace(/-/g, "")}` : "",
      referredBy: agent ? ref : "",
      trustScore: 60,
      createdAt: nowIso(),
    });
    discord("user_registered", `Tài khoản mới: ${role === "runner" ? "Runner" : input.orgName || role}`, {
      fields: { "Vai trò": role, "Giới thiệu bởi": agent ? ref : "—" },
      link: "/admin/users",
    });
    if (agent) await notify(agent.id, "Khách hàng mới qua link giới thiệu", `${user.name} vừa đăng ký.`, "/agent");
    await notify(user.id, "Chào mừng đến KBIB 👋", "Hoàn thiện hồ sơ để giao dịch nhanh hơn.", "/dashboard/profile");
    (await cookies()).set(SESSION_COOKIE, await signSession({ uid: user.id, role }), sessionCookieOptions);
  });
  if (res.error) return res;
  redirect(ROLE_HOME[role]);
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role, User } from "@/lib/types";
import { SESSION_COOKIE, verifySession } from "./session";

/** Data Access Layer: the only place that turns a cookie into a user. Authorization lives here, not in proxy. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.users.get(session.uid);
  if (!user || user.status !== "active") return null;
  return user;
});

export async function requireUser(next?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin" && !roles.includes(user.role)) redirect("/forbidden");
  return user;
}

/** Safe subset for client components. */
export function publicUser(u: User) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, verified: u.verified, trustScore: u.trustScore };
}
export type PublicUser = ReturnType<typeof publicUser>;

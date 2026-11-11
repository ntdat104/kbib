import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/types";

export const SESSION_COOKIE = "kbib_session";
const MAX_AGE = 60 * 60 * 24 * 14;

export interface SessionPayload {
  uid: string;
  role: Role;
}

function key() {
  const secret = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me-please-32+";
  return new TextEncoder().encode(secret);
}

export async function signSession(p: SessionPayload) {
  return new SignJWT({ ...p })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return { uid: String(payload.uid), role: payload.role as Role };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

import { db, newId } from "@/lib/db";
import { nowIso } from "@/lib/utils";

export async function notify(userId: string, title: string, body: string, link = "") {
  if (!userId) return;
  await db.notifications.insert({ id: newId("ntf"), userId, title, body, link, read: false, createdAt: nowIso() });
}

export async function notifyAdmins(title: string, body: string, link = "") {
  const admins = await db.users.where((u) => u.role === "admin");
  for (const a of admins) await notify(a.id, title, body, link);
}

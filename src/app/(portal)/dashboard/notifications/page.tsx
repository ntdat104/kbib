import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { markNotificationsReadAction } from "@/lib/actions/market";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Thông báo" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notes = (await db.notifications.where((n) => n.userId === user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Thông báo" action={notes.some((n) => !n.read) && <form action={markNotificationsReadAction}><Button variant="outline" size="sm">Đánh dấu đã đọc</Button></form>} />
      {notes.length ? (
        <Card>
          <ul className="divide-y divide-line">
            {notes.map((n) => (
              <li key={n.id}>
                <Link href={n.link || "#"} className={cn("flex gap-3 px-5 py-4 hover:bg-brand-50/40", !n.read && "bg-brand-50/30")}>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand-500")} />
                  <div><p className="text-sm font-semibold">{n.title}</p><p className="text-sm text-muted">{n.body}</p><p className="mt-1 text-xs text-stone-400">{formatDateTime(n.createdAt)}</p></div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : <EmptyState icon={<Bell className="size-5" />} title="Chưa có thông báo" />}
    </>
  );
}

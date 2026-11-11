import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { fraudFlagAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Chống gian lận" };

export default async function AdminFraud() {
  await requireRole("admin");
  const [flags, users, orders, listings] = await Promise.all([db.fraud_flags.where((f) => f.status === "open"), db.users.all(), db.orders.all(), db.listings.all()]);
  return (
    <>
      <PageHeader title="Chống phe vé & gian lận" subtitle="Cờ tự động từ hành vi: gom bib, đăng hàng loạt, giá sát trần." />
      {flags.length ? (
        <div className="space-y-3">
          {flags.map((f) => {
            const u = users.find((x) => x.id === f.userId);
            return (
              <Card key={f.id} className="flex flex-wrap items-center gap-4 p-5">
                <Badge tone={f.severity === "high" ? "rose" : f.severity === "medium" ? "amber" : "stone"}>{f.severity.toUpperCase()}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{f.reason}</p>
                  <p className="text-xs text-muted">{u?.name} · {u?.email} · {orders.filter((o) => o.buyerId === f.userId).length} đơn mua · {listings.filter((l) => l.sellerId === f.userId).length} tin · {formatDateTime(f.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <form action={fraudFlagAction}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="action" value="clear" /><Button size="sm" variant="outline">Bỏ qua</Button></form>
                  <form action={fraudFlagAction}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="action" value="suspend" /><Button size="sm" variant="danger">Khoá tài khoản</Button></form>
                </div>
              </Card>
            );
          })}
        </div>
      ) : <EmptyState icon={<ShieldCheck className="size-5" />} title="Không có cờ gian lận" />}
    </>
  );
}

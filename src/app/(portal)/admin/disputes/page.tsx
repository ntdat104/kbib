import type { Metadata } from "next";
import Link from "next/link";
import { Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { ResolveForm } from "@/components/portal/resolve-form";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Tranh chấp" };

export default async function AdminDisputes() {
  await requireRole("admin");
  const [disputes, orders, users] = await Promise.all([db.disputes.all(), db.orders.all(), db.users.all()]);
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? "—";
  const sorted = [...disputes].sort((a, b) => Number(b.status === "open") - Number(a.status === "open") || b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Tranh chấp" subtitle="SLA xử lý ≤ 48h. Tiền vẫn được giữ trong escrow cho đến khi có kết luận." />
      {sorted.length ? (
        <div className="space-y-3">
          {sorted.map((d) => {
            const o = orders.find((x) => x.id === d.orderId);
            return (
              <Card key={d.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{d.reason}</p>
                    <p className="text-xs text-muted">Đơn <Link href={`/orders/${d.orderId}`} className="font-mono font-semibold text-brand-700">{o?.code}</Link> · {formatVND(o?.total ?? 0)} · mở bởi {name(d.openedBy)} · {formatDateTime(d.createdAt)}</p>
                    <p className="text-xs text-muted">Mua: {name(o?.buyerId ?? "")} · Bán: {name(o?.sellerId ?? "")}</p>
                  </div>
                  <Badge tone={d.status === "open" ? "rose" : "emerald"}>{d.status === "open" ? "Đang mở" : d.status === "resolved_buyer" ? "Hoàn tiền" : "Giải ngân"}</Badge>
                </div>
                <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm text-stone-600">{d.detail}</p>
                {d.status === "open" ? <ResolveForm id={d.id} /> : <p className="mt-2 text-sm text-muted">Kết luận: {d.resolution}</p>}
              </Card>
            );
          })}
        </div>
      ) : <EmptyState icon={<Scale className="size-5" />} title="Không có tranh chấp" />}
    </>
  );
}

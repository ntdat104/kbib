import type { Metadata } from "next";
import { Coins, Link2, Tag, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui/card";
import { OrdersTable } from "@/components/portal/orders-table";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/services/settings";
import { formatDate, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Cổng đại lý" };

export default async function AgentPage() {
  const user = await requireRole("agent");
  const code = user.referralCode;
  const [clients, orders, payouts, listings, s] = await Promise.all([
    db.users.where((u) => Boolean(code) && u.referredBy === code),
    db.orders.where((o) => o.agentId === user.id),
    db.payouts.where((p) => p.userId === user.id && p.type === "agent_commission"),
    db.listings.where((l) => l.agentId === user.id && l.status === "active"),
    getSettings(),
  ]);
  const earned = payouts.reduce((a, p) => a + p.amount, 0);
  const pipeline = orders.filter((o) => !["completed", "cancelled", "refunded"].includes(o.status)).reduce((a, o) => a + o.agentCommission, 0);
  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/register?ref=${code}`;
  return (
    <>
      <PageHeader eyebrow="Đại lý" title="Cổng đại lý" subtitle={`Nhận ${s.agentSharePct}% phí sàn từ mọi giao dịch của khách hàng bạn giới thiệu hoặc đăng bán thay.`} action={<ButtonLink href="/sell"><Tag className="size-4" /> Đăng bib thay khách</ButtonLink>} />
      <Card className="mb-6 flex flex-col gap-3 bg-gradient-to-r from-brand-50 to-white p-5 sm:flex-row sm:items-center">
        <Link2 className="size-5 text-brand-600" />
        <div className="min-w-0 flex-1"><p className="text-sm text-muted">Link giới thiệu · mã <b className="text-ink">{code}</b></p><p className="truncate font-mono text-sm font-semibold">{link}</p></div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Khách hàng" value={clients.length} icon={<Users className="size-4" />} />
        <StatCard label="Đơn phát sinh" value={orders.length} icon={<Tag className="size-4" />} />
        <StatCard label="Hoa hồng đã ghi nhận" value={formatVND(earned)} icon={<Coins className="size-4" />} />
        <StatCard label="Hoa hồng đang chờ" value={formatVND(pipeline)} hint="Đơn chưa hoàn tất" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Đơn từ khách của bạn" />
          {orders.length ? <OrdersTable orders={orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20)} /> : <div className="p-5"><EmptyState title="Chưa có đơn" body="Chia sẻ link giới thiệu cho CLB chạy bộ của bạn." /></div>}
        </Card>
        <Card>
          <CardHeader title="Khách hàng" subtitle={`${listings.length} tin đang bán thay khách`} />
          <ul className="divide-y divide-line">
            {clients.slice(0, 15).map((c) => (
              <li key={c.id} className="flex justify-between px-5 py-3 text-sm"><span className="font-medium">{c.name}</span><span className="text-muted">{formatDate(c.createdAt)}</span></li>
            ))}
            {!clients.length && <li className="p-5 text-sm text-muted">Chưa có khách hàng.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}

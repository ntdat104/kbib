import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Receipt, ShieldCheck, Sparkles, Tag, Wallet } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/market/bits";
import { RaceCover } from "@/components/market/race-cover";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { recommendationsFor } from "@/lib/services/insights";
import { formatDate, formatDateTime, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [orders, listings, payouts, reco, notes, races] = await Promise.all([
    db.orders.where((o) => o.buyerId === user.id || o.sellerId === user.id),
    db.listings.where((l) => l.sellerId === user.id && l.status === "active"),
    db.payouts.where((p) => p.userId === user.id),
    recommendationsFor(user),
    db.notifications.where((n) => n.userId === user.id),
    db.races.all(),
  ]);
  const raceName = (id: string) => races.find((r) => r.id === id)?.name ?? "";
  const todo = orders.filter(
    (o) => (o.buyerId === user.id && ["pending_payment", "transferred"].includes(o.status)) || (o.sellerId === user.id && o.status === "transferring"),
  );
  const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const bought = orders.filter((o) => o.buyerId === user.id && !["cancelled", "refunded"].includes(o.status)).length;

  return (
    <>
      <PageHeader title={`Xin chào, ${user.name.split(" ").at(-1)} 👋`} subtitle="Mọi giao dịch của bạn đều được bảo vệ bởi KBIB Escrow." action={<ButtonLink href="/sell"><Tag className="size-4" /> Đăng bán bib</ButtonLink>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bib đã mua" value={bought} icon={<Receipt className="size-4" />} />
        <StatCard label="Tin đang bán" value={listings.length} icon={<Tag className="size-4" />} />
        <StatCard label="Chờ nhận về ví" value={formatVND(pending)} icon={<Wallet className="size-4" />} />
        <StatCard label="Điểm uy tín" value={`${user.trustScore}/100`} hint={user.verified ? "Đã xác minh danh tính" : "Chưa xác minh"} icon={<ShieldCheck className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="Cần bạn xử lý" subtitle="Hoàn tất các bước để giao dịch không bị trễ hạn đổi tên" />
          {todo.length ? (
            <ul className="divide-y divide-line">
              {todo.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-brand-50/40">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{raceName(o.raceId)}</p>
                      <p className="text-xs text-muted">
                        {o.status === "pending_payment" ? "Thanh toán để giữ bib" : o.status === "transferred" ? "Xác nhận đã đứng tên" : "Chờ đổi tên – theo dõi tiến độ"} · {o.code}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <ArrowRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5"><EmptyState icon={<ShieldCheck className="size-5" />} title="Không có việc cần làm" body="Tất cả giao dịch đang diễn ra suôn sẻ." /></div>
          )}
        </Card>
        <Card>
          <CardHeader title="Thông báo mới" action={<Link href="/dashboard/notifications" className="text-sm font-medium text-brand-700">Tất cả</Link>} />
          <ul className="divide-y divide-line">
            {notes.slice(-5).reverse().map((n) => (
              <li key={n.id} className="px-5 py-3">
                <Link href={n.link || "#"} className="block">
                  <p className="text-sm font-medium">{!n.read && <span className="mr-1.5 inline-block size-2 rounded-full bg-brand-500" />}{n.title}</p>
                  <p className="line-clamp-1 text-xs text-muted">{n.body} · {formatDateTime(n.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="size-5 text-brand-600" /> Gợi ý giải chạy cho bạn</h2>
        <p className="text-sm text-muted">Dựa trên lịch sử chạy, vùng miền và thời gian tập luyện hợp lý.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {reco.races.map((r) => (
            <Link key={r.id} href={`/races/${r.slug}`} className="card group overflow-hidden transition hover:shadow-lift">
              <div className="relative aspect-[16/9]"><RaceCover type={r.type} seed={r.id} coverUrl={r.coverUrl} label={r.name} sizes="(min-width: 1280px) 240px, (min-width: 640px) 50vw, 100vw" /></div>
              <div className="p-3"><p className="line-clamp-1 text-sm font-semibold group-hover:text-brand-700">{r.name}</p><p className="text-xs text-muted">{formatDate(r.date)} · {r.city}</p></div>
            </Link>
          ))}
        </div>
        {reco.crossSell && (
          <Card className="mt-4 p-5">
            <p className="font-semibold">Chuẩn bị cho {reco.crossSell.bucket}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reco.crossSell.items.map((i) => <span key={i.name} className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700" title={i.why}>{i.name}</span>)}
            </div>
          </Card>
        )}
      </section>
    </>
  );
}

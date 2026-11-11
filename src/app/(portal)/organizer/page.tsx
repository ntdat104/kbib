import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Coins, Ticket, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { BarList } from "@/components/ui/charts";
import { TypeBadge } from "@/components/market/bits";
import { requireRole } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { formatDate, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Cổng Ban tổ chức" };

export default async function OrganizerHome() {
  const user = await requireRole("organizer");
  const races = await db.races.where((r) => user.role === "admin" || r.organizerId === user.id);
  const ids = new Set(races.map((r) => r.id));
  const [transfers, orders, wtb, listings] = await Promise.all([
    db.transfers.where((t) => ids.has(t.raceId)),
    db.orders.where((o) => ids.has(o.raceId) && ["completed", "transferred", "transferring"].includes(o.status)),
    db.wtb_alerts.where((a) => ids.has(a.raceId) && a.status === "active"),
    db.listings.where((l) => ids.has(l.raceId) && l.status === "active"),
  ]);
  const pending = transfers.filter((t) => t.status === "requested").length;
  const feeIncome = transfers.filter((t) => t.status === "approved").reduce((s, t) => s + t.organizerFee - t.platformShare, 0);
  const official = orders.filter((o) => o.kind === "official");
  const upcoming = races.filter((r) => r.status === "published").sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <PageHeader eyebrow={user.orgName} title="Cổng Ban tổ chức" subtitle="Kiểm soát chuyển nhượng, bán suất chính thức và hiểu nhu cầu runner." action={<ButtonLink href="/organizer/transfers"><ClipboardList className="size-4" /> Duyệt đổi tên ({pending})</ButtonLink>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Giải đang quản lý" value={upcoming.length} icon={<Ticket className="size-4" />} />
        <StatCard label="Yêu cầu chờ duyệt" value={pending} icon={<ClipboardList className="size-4" />} />
        <StatCard label="Thu phí đổi tên (thực nhận)" value={formatVND(feeIncome)} icon={<Coins className="size-4" />} />
        <StatCard label="Suất chính thức đã bán" value={official.length} hint={formatVND(official.reduce((s, o) => s + o.sellerPayout, 0))} icon={<Users className="size-4" />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Nhu cầu chưa đáp ứng" subtitle="Runner đang chờ bib theo giải – cơ hội mở thêm suất late-bird" />
          <div className="p-5">
            <BarList data={upcoming.map((r) => ({ label: r.name, value: wtb.filter((a) => a.raceId === r.id).length, sub: `${listings.filter((l) => l.raceId === r.id).length} bib đang bán` })).sort((a, b) => b.value - a.value).slice(0, 8)} format={(v) => `${v} người`} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Giải sắp tới" action={<Link href="/organizer/races" className="text-sm font-medium text-brand-700">Quản lý</Link>} />
          <ul className="divide-y divide-line">
            {upcoming.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <TypeBadge type={r.type} />
                <Link href={`/races/${r.slug}`} className="min-w-0 flex-1 truncate font-medium hover:text-brand-700">{r.name}</Link>
                <span className="text-muted">{formatDate(r.date)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Database, Landmark, Percent, RefreshCw, Scale, ShieldAlert, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { BarList, ColumnChart } from "@/components/ui/charts";
import { reloadCacheAction, runEscrowJobsAction } from "@/lib/actions/portal";
import { requireRole } from "@/lib/auth/dal";
import { db, driverName } from "@/lib/db";
import { STREAM_LABEL } from "@/lib/services/ledger";
import type { RevenueStream } from "@/lib/types";
import { formatCompactVND, formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Quản trị doanh thu" };

export default async function AdminHome() {
  await requireRole("admin");
  const [ledger, orders, payouts, disputes, flags, users] = await Promise.all([
    db.ledger.all(), db.orders.all(), db.payouts.where((p) => p.status === "pending"),
    db.disputes.where((d) => d.status === "open"), db.fraud_flags.where((f) => f.status === "open"), db.users.all(),
  ]);
  const byStream = new Map<RevenueStream, number>();
  for (const e of ledger) byStream.set(e.stream, (byStream.get(e.stream) ?? 0) + e.amount);
  const gross = ledger.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const net = ledger.reduce((s, e) => s + e.amount, 0);
  const completed = orders.filter((o) => o.status === "completed");
  const gmv = completed.reduce((s, o) => s + o.price, 0);
  const escrow = orders.filter((o) => ["transferring", "transferred", "disputed", "paid"].includes(o.status)).reduce((s, o) => s + o.total, 0);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label: `T${d.getMonth() + 1}`, value: ledger.filter((e) => e.createdAt.startsWith(key)).reduce((s, e) => s + e.amount, 0) };
  });
  const streams = [...byStream.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const costs = [...byStream.entries()].filter(([, v]) => v < 0);

  return (
    <>
      <PageHeader eyebrow="Quản trị" title="Doanh thu & vận hành" subtitle={`${users.length} tài khoản · ${orders.length} đơn · ${ledger.length} bút toán`}
        action={<>
          <form action={runEscrowJobsAction}><Button variant="outline" size="sm"><Timer className="size-4" /> Chạy job escrow</Button></form>
          <form action={reloadCacheAction}><Button variant="outline" size="sm"><RefreshCw className="size-4" /> Làm mới cache</Button></form>
        </>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Doanh thu ròng" value={formatCompactVND(net)} hint={`Gộp ${formatCompactVND(gross)} − chia sẻ đối tác`} icon={<Coins className="size-4" />} />
        <StatCard label="GMV bib hoàn tất" value={formatCompactVND(gmv)} hint={`${completed.length} đơn`} icon={<Landmark className="size-4" />} />
        <StatCard label="Take rate" value={`${gmv ? ((net / gmv) * 100).toFixed(1) : 0}%`} hint="Doanh thu ròng / GMV" icon={<Percent className="size-4" />} />
        <StatCard label="Đang giữ escrow" value={formatCompactVND(escrow)} hint={`Chờ chi trả ${formatCompactVND(payouts.reduce((s, p) => s + p.amount, 0))}`} icon={<Database className="size-4" />} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Doanh thu theo dòng" subtitle="12 nguồn thu theo mô hình kinh doanh" />
          <div className="p-5">
            <BarList data={streams.map(([k, v]) => ({ label: STREAM_LABEL[k], value: v, sub: `${((v / gross) * 100).toFixed(1)}% tổng` }))} format={formatVND} />
            {costs.length > 0 && (
              <div className="mt-5 border-t border-line pt-4 text-sm">
                {costs.map(([k, v]) => <p key={k} className="flex justify-between text-muted"><span>{STREAM_LABEL[k]}</span><span className="tabular-nums">{formatVND(v)}</span></p>)}
              </div>
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Doanh thu ròng theo tháng" />
            <div className="p-5 pt-10"><ColumnChart data={months} format={formatCompactVND} /></div>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/disputes"><StatCard label="Tranh chấp mở" value={disputes.length} icon={<Scale className="size-4" />} /></Link>
            <Link href="/admin/fraud"><StatCard label="Cờ gian lận" value={flags.length} icon={<ShieldAlert className="size-4" />} /></Link>
          </div>
          <Card className="p-5 text-sm">
            <p className="font-semibold">Backend dữ liệu</p>
            <p className="mt-1 text-muted">Driver: <b className="text-ink">{driverName() === "sheets" ? "Google Sheets" : "Local JSON (demo)"}</b></p>
            {driverName() === "local" && <p className="mt-1 text-xs text-muted">Thêm GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY vào .env.local rồi chạy <code>npm run sheets:setup -- --seed</code>.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}

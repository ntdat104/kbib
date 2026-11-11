import type { Metadata } from "next";
import Link from "next/link";
import { Activity, BarChart3, Flame, Lock, TrendingUp, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { BarList, ColumnChart } from "@/components/ui/charts";
import { SubmitButton } from "@/components/ui/form";
import { TypeBadge } from "@/components/market/bits";
import { subscribeDataAction } from "@/lib/actions/portal";
import { getCurrentUser } from "@/lib/auth/dal";
import { activeDataPlan } from "@/lib/services/marketplace";
import { marketInsights } from "@/lib/services/insights";
import { getSettings } from "@/lib/services/settings";
import { formatCompactVND, formatDate, formatNumber, formatVND, REGION_LABEL } from "@/lib/utils";

export const metadata: Metadata = { title: "Dữ liệu thị trường bib" };

const pctFmt = (v: number) => `${Math.round(v * 100)}%`;

export default async function InsightsPage() {
  const [m, user, s] = await Promise.all([marketInsights(), getCurrentUser(), getSettings()]);
  const plan = user ? await activeDataPlan(user.id) : null;
  const full = Boolean(plan) || user?.role === "admin";
  const canBuy = user && ["brand", "organizer"].includes(user.role);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader eyebrow="Market Intelligence" title="Nhịp đập thị trường bib Việt Nam" subtitle="Dữ liệu giao dịch thực trên KBIB: giải nào cháy vé, cự ly nào hot, giá biến động thế nào khi gần ngày chạy." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="GMV đã giao dịch" value={formatCompactVND(m.totals.gmv)} icon={<BarChart3 className="size-4" />} />
        <StatCard label="Đơn chuyển nhượng" value={formatNumber(m.totals.orders)} icon={<Activity className="size-4" />} />
        <StatCard label="Runner đang tìm bib" value={formatNumber(m.totals.seekers)} icon={<Users className="size-4" />} />
        <StatCard label="Giá bán / giá gốc" value={pctFmt(m.totals.avgPremium)} hint="Trung bình mọi giao dịch" icon={<TrendingUp className="size-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Giá bib theo thời gian còn lại đến race" subtitle="Giá bán trung bình so với giá gốc BTC" />
          <div className="p-5 pt-10"><ColumnChart data={m.priceCurve.map((p) => ({ label: p.label, value: p.avgPremium, hint: `${p.count} đơn` }))} format={pctFmt} /></div>
        </Card>
        <Card>
          <CardHeader title="GMV theo tháng" subtitle="Tổng giá trị bib giao dịch, 6 tháng gần nhất" />
          <div className="p-5 pt-10"><ColumnChart data={m.months.map((x) => ({ label: x.label, value: x.gmv, hint: `${x.count} đơn` }))} format={formatCompactVND} /></div>
        </Card>
      </div>

      <div className="relative mt-6">
        <div className={full ? "" : "pointer-events-none select-none blur-[5px]"} aria-hidden={!full}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title={<span className="inline-flex items-center gap-2"><Flame className="size-4 text-brand-600" />Giải chạy đang “cháy” bib</span>} subtitle="Điểm cầu = đơn×3 + người tìm×2 + lượt xem/20" />
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr><th>Giải</th><th className="text-right">Cầu</th><th className="text-right">Đã bán</th><th className="text-right">Đang bán</th><th className="text-right">Đang tìm</th><th className="text-right">Giá/gốc</th></tr></thead>
                  <tbody>
                    {m.hotRaces.slice(0, 10).map((h) => (
                      <tr key={h.race.id}>
                        <td><Link href={`/races/${h.race.slug}`} className="font-medium hover:text-brand-700">{h.race.name}</Link><div className="mt-0.5 flex items-center gap-2 text-xs text-muted"><TypeBadge type={h.race.type} />{formatDate(h.race.date)}</div></td>
                        <td className="text-right font-semibold tabular-nums">{h.demandScore}</td>
                        <td className="text-right tabular-nums">{h.sold}</td>
                        <td className="text-right tabular-nums">{h.active}</td>
                        <td className="text-right tabular-nums">{h.seekers}</td>
                        <td className="text-right tabular-nums">{h.avgPremium ? pctFmt(h.avgPremium) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader title="Nhu cầu theo cự ly" subtitle="Số đơn · tỷ lệ bán hết · giá/gốc" />
                <div className="p-5"><BarList data={m.distanceDemand.map((d) => ({ label: d.label, value: d.count, sub: `Bán hết ${pctFmt(Math.min(1, d.sellThrough))} · giá/gốc ${pctFmt(d.avgPremium)}` }))} format={(v) => `${v} đơn`} /></div>
              </Card>
              <Card>
                <CardHeader title="Theo vùng miền" />
                <div className="p-5"><BarList data={m.regions.map((r) => ({ label: REGION_LABEL[r.region as keyof typeof REGION_LABEL], value: r.count }))} format={(v) => `${v} đơn`} /></div>
              </Card>
            </div>
          </div>
        </div>

        {!full && (
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="card max-w-xl p-6 text-center shadow-lift">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Lock className="size-5" /></span>
              <h2 className="mt-3 text-xl font-bold">Mở khoá báo cáo đầy đủ</h2>
              <p className="mt-1 text-sm text-muted">Dành cho Ban tổ chức & Thương hiệu: định giá vé mùa sau, chọn giải tài trợ, nhắm đúng runner.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {([["basic", "Basic", s.dataBasic, "Top 10 giải, cự ly"], ["pro", "Pro", s.dataPro, "+ đường giá, vùng miền, xuất CSV"], ["enterprise", "Enterprise", s.dataEnterprise, "+ API, phân khúc runner"]] as const).map(([k, name, price, d]) => (
                  <form key={k} action={subscribeDataAction} className="rounded-2xl border border-line p-3 text-left">
                    <input type="hidden" name="plan" value={k} />
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm font-bold text-brand-700">{formatVND(price)}<span className="font-normal text-muted">/th</span></p>
                    <p className="mt-1 min-h-8 text-xs text-muted">{d}</p>
                    {canBuy ? <SubmitButton size="sm" className="mt-2 w-full">Đăng ký</SubmitButton> : null}
                  </form>
                ))}
              </div>
              {!canBuy && <ButtonLink href={user ? "/partners#brand" : "/register?role=brand"} className="mt-4">Đăng ký tài khoản đối tác</ButtonLink>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

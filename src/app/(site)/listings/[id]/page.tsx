import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, FileCheck2, Lock, MapPin, Package, ShieldCheck, Shirt, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { HotBadge, PriceTag, TrustLine, TypeBadge } from "@/components/market/bits";
import { RaceCover } from "@/components/market/race-cover";
import { OwnerTools } from "@/components/market/owner-tools";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { checkEligibility, getListing } from "@/lib/services/catalog";
import { crossSellFor, suggestedPrice } from "@/lib/services/insights";
import { quote } from "@/lib/services/pricing";
import { bump } from "@/lib/services/counters";
import { getSettings, PROMO_PACKAGES } from "@/lib/services/settings";
import { daysUntil, formatDate, formatVND } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/listings/[id]">): Promise<Metadata> {
  const l = await getListing((await params).id);
  return { title: l ? `${l.distance.name} · ${l.race.name}` : "Bib" };
}

export default async function ListingPage({ params, searchParams }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const l = await getListing(id);
  if (!l) notFound();
  const [user, s, suggestion] = await Promise.all([getCurrentUser(), getSettings(), suggestedPrice(l.distanceId)]);
  if (l.status === "active") bump("listings", l.id);
  const isOwner = user && (user.id === l.sellerId || user.id === l.agentId || user.id === l.brokerId);
  const consignment = l.consignmentId ? await db.consignments.get(l.consignmentId) : null;
  const q = quote(s, l.kind, l.price, 0, consignment?.feePct);
  const elig = checkEligibility(l.distance, user);
  const cross = crossSellFor(l.distance, l.race.type);
  const deadline = daysUntil(l.race.transferDeadline);
  const today = new Date().toISOString().slice(0, 10);
  const canBuy = l.status === "active" && !isOwner && l.race.transferPolicy !== "closed" && l.race.transferDeadline >= today;
  const promoPrices = Object.fromEntries(Object.entries(PROMO_PACKAGES).map(([k, p]) => [k, s[p.key]]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 sm:px-6 lg:pb-8">
      <Link href={`/races/${l.race.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-brand-700">
        <ArrowLeft className="size-4" /> {l.race.name}
      </Link>

      {sp.created && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-semibold">Tin đăng đã lên sàn!</p><p>Đẩy tin để bán nhanh hơn ~3 lần – runner đang theo dõi cự ly này sẽ nhận thông báo.</p></div>
        </div>
      )}

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/7]">
              <RaceCover type={l.race.type} seed={l.race.id} coverUrl={l.race.coverUrl} label={l.race.name} sizes="(min-width: 1024px) 700px, 100vw" priority />
              <div className="absolute bottom-4 left-4 rounded-2xl bg-white/95 px-4 py-3 shadow-lift">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Bib</p>
                <p className="text-3xl font-extrabold text-brand-700">{l.distance.name}</p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={l.race.type} />
                {l.promoted && <HotBadge />}
                {l.kind === "official" && <Badge tone="emerald" icon={<BadgeCheck className="size-3" />}>Suất chính thức BTC</Badge>}
                {l.kind === "consignment" && <Badge tone="violet">KBIB bán hộ</Badge>}
                {l.status !== "active" && <Badge tone="stone">{l.status === "sold" ? "Đã bán" : l.status === "reserved" ? "Đang giữ chỗ" : "Ngừng bán"}</Badge>}
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight">{l.race.name}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />{formatDate(l.race.date)}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="size-4" />{l.race.city}</span>
                {l.shirtSize && <span className="inline-flex items-center gap-1"><Shirt className="size-4" />Áo size {l.shirtSize}</span>}
                {l.includesKit && <span className="inline-flex items-center gap-1"><Package className="size-4" />Kèm race kit</span>}
              </div>
              {l.note && <p className="mt-4 rounded-xl bg-stone-50 p-4 text-sm text-stone-600">“{l.note}”</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Người bán" />
            <div className="p-5"><TrustLine {...l.seller} /></div>
          </Card>

          <Card>
            <CardHeader title="Vì sao mua trên KBIB an toàn?" />
            <ul className="grid gap-4 p-5 sm:grid-cols-3">
              {[
                { icon: Lock, t: "Escrow giữ tiền", b: "Người bán chỉ nhận tiền sau khi bạn đứng tên." },
                { icon: FileCheck2, t: "Đổi tên chính thức", b: l.race.transferPolicy === "official" ? "Yêu cầu gửi trực tiếp tới BTC." : "Người bán bàn giao, KBIB giám sát." },
                { icon: ShieldCheck, t: "Hoàn tiền 100%", b: "Nếu đổi tên thất bại hoặc bib không hợp lệ." },
              ].map((x) => (
                <li key={x.t}>
                  <x.icon className="size-5 text-brand-600" />
                  <p className="mt-2 text-sm font-semibold">{x.t}</p>
                  <p className="text-xs text-muted">{x.b}</p>
                </li>
              ))}
            </ul>
          </Card>

          {cross.items.length > 0 && (
            <Card>
              <CardHeader title={`Chuẩn bị cho ${cross.bucket}`} subtitle="Gợi ý từ dữ liệu hàng nghìn runner cùng cự ly" />
              <ul className="divide-y divide-line">
                {cross.items.map((i) => (
                  <li key={i.name} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <Sparkles className="size-4 shrink-0 text-brand-500" />
                    <span className="font-medium">{i.name}</span>
                    <span className="text-muted">– {i.why}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <PriceTag price={l.price} original={l.originalPrice} size="lg" />
            <p className="mt-1 text-xs text-muted">Giá gốc BTC {formatVND(l.originalPrice)} · Trần giá {l.race.priceCapPct}%</p>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Giá bib</dt><dd className="tabular-nums">{formatVND(q.price)}</dd></div>
              {q.buyerFee > 0 && <div className="flex justify-between"><dt className="text-muted">Phí dịch vụ ({s.buyerFeePct}%)</dt><dd className="tabular-nums">{formatVND(q.buyerFee)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Phí escrow & xác thực</dt><dd className="tabular-nums">{formatVND(q.escrowFee)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Tạm tính</dt><dd className="tabular-nums">{formatVND(q.total)}</dd></div>
            </dl>
            {l.race.transferFee > 0 && <p className="mt-2 text-xs text-muted">Phí đổi tên BTC {formatVND(l.race.transferFee)} do người bán chịu theo quy định giải.</p>}

            {elig.required && (
              <div className={`mt-4 rounded-xl p-3 text-sm ${elig.eligible ? "bg-trail-50 text-trail-700" : "bg-amber-50 text-amber-800"}`}>
                <p className="flex items-center gap-1.5 font-semibold">
                  {elig.eligible ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                  {elig.eligible ? "Bạn đủ điều kiện cự ly này" : "Cự ly yêu cầu điều kiện"}
                </p>
                <ul className="mt-1 space-y-0.5 text-xs">
                  {elig.reqs.map((r) => <li key={r.label}>{r.ok ? "✓" : "✗"} {r.label}</li>)}
                </ul>
                {!elig.eligible && user && <Link href="/dashboard/profile" className="mt-2 inline-block text-xs font-semibold underline">Cập nhật hồ sơ năng lực</Link>}
              </div>
            )}

            {l.status === "active" && l.race.transferDeadline < today && <p className="mt-3 rounded-xl bg-stone-100 p-3 text-sm text-stone-600">Đã quá hạn đổi tên của BTC – bib này không thể chuyển nhượng nữa.</p>}
            {deadline >= 0 && deadline <= 10 && <p className="mt-3 text-xs font-medium text-rose-600">⚡ Còn {deadline} ngày đến hạn đổi tên của BTC</p>}

            <div className="mt-4 hidden lg:block">
              {canBuy && <ButtonLink href={`/checkout/${l.id}`} size="lg" className="w-full">Mua bib an toàn</ButtonLink>}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted"><ShieldCheck className="size-3.5 text-emerald-600" /> Được bảo vệ bởi KBIB Escrow</p>
          </Card>

          {isOwner && l.status === "active" && (
            <OwnerTools id={l.id} price={l.price} cap={Math.floor((l.originalPrice * l.race.priceCapPct) / 100 / 1000) * 1000} promoPrices={promoPrices} promotedUntil={l.promotedUntil} suggestion={suggestion} />
          )}
        </aside>
      </div>

      {canBuy && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-1">
            <div className="flex-1"><p className="text-xs text-muted">Tổng tạm tính</p><p className="font-bold tabular-nums">{formatVND(q.total)}</p></div>
            <ButtonLink href={`/checkout/${l.id}`} size="lg">Mua ngay</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}

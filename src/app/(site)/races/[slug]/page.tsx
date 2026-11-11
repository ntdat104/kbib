import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, BellRing, CalendarDays, CheckCircle2, Clock, FileCheck2, MapPin, Mountain, Ticket, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, Progress } from "@/components/ui/card";
import { AdSlot } from "@/components/market/ad-slot";
import { TypeBadge } from "@/components/market/bits";
import { ListingRow } from "@/components/market/listing-card";
import { RaceCover } from "@/components/market/race-cover";
import { AlertForm } from "@/components/market/alert-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { racePhoto } from "@/lib/images";
import { db } from "@/lib/db";
import { checkEligibility, getListingsForRace, getRaceBySlug, getUserName } from "@/lib/services/catalog";
import { cn, daysUntil, formatDate, formatVND, pct, REGION_LABEL } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/races/[slug]">): Promise<Metadata> {
  const data = await getRaceBySlug((await params).slug);
  return { title: data ? `Bib ${data.race.name}` : "Không tìm thấy giải" };
}

const POLICY = {
  official: { label: "Đổi tên chính thức qua KBIB", tone: "emerald" as const, icon: FileCheck2 },
  allowed: { label: "Cho phép chuyển nhượng (người bán bàn giao)", tone: "amber" as const, icon: AlertTriangle },
  closed: { label: "BTC đã đóng chuyển nhượng", tone: "rose" as const, icon: XCircle },
};

export default async function RacePage({ params, searchParams }: PageProps<"/races/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = await getRaceBySlug(slug);
  if (!data) notFound();
  const { race, distances } = data;
  const [listings, user, organizer, services, wtb] = await Promise.all([
    getListingsForRace(race.id),
    getCurrentUser(),
    getUserName(race.organizerId),
    db.services.where((s) => s.active && (s.raceId === race.id || s.raceId === "")),
    db.wtb_alerts.where((a) => a.raceId === race.id && a.status === "active"),
  ]);
  const activeDist = typeof sp.d === "string" ? sp.d : "";
  const shown = activeDist ? listings.filter((l) => l.distanceId === activeDist) : listings;
  const policy = POLICY[race.transferPolicy];
  const photo = racePhoto(race.type, race.id, race.coverUrl);
  const days = daysUntil(race.date);
  const deadlineDays = daysUntil(race.transferDeadline);

  return (
    <div>
      <div className="relative h-72 overflow-hidden sm:h-[26rem]">
        <RaceCover type={race.type} seed={race.id} coverUrl={race.coverUrl} label={race.name} sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <TypeBadge type={race.type} />
            <Badge tone={policy.tone} icon={<policy.icon className="size-3" />}>{policy.label}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{race.name}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/85">
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" />{formatDate(race.date, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-4" />{race.city} · {REGION_LABEL[race.region]}</span>
            <span>BTC: {organizer}</span>
            {photo.credit && <a href={photo.credit} target="_blank" rel="noopener" className="text-white/60 hover:text-white">Ảnh: Unsplash</a>}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* Distances */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {distances.map((d) => {
              const count = listings.filter((l) => l.distanceId === d.id).length;
              const min = Math.min(...listings.filter((l) => l.distanceId === d.id).map((l) => l.price));
              const elig = checkEligibility(d, user);
              return (
                <Link key={d.id} href={activeDist === d.id ? `/races/${slug}` : `/races/${slug}?d=${d.id}#bibs`} scroll={false}
                  className={cn("card p-4 transition hover:border-brand-300", activeDist === d.id && "border-brand-500 ring-2 ring-brand-100")}>
                  <div className="flex items-start justify-between">
                    <p className="text-2xl font-extrabold tracking-tight">{d.name}</p>
                    <span className="text-xs text-muted">Gốc {formatVND(d.originalPrice)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                    {d.elevationGain > 0 && <span className="inline-flex items-center gap-1"><Mountain className="size-3.5" />{d.elevationGain.toLocaleString("vi-VN")}m D+</span>}
                    <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />COT {d.cutoffHours}h</span>
                  </div>
                  <Progress value={pct(d.registered, d.capacity)} className="mt-3" tone={race.type === "trail" ? "trail" : "brand"} />
                  <p className="mt-1 text-[11px] text-muted">{pct(d.registered, d.capacity)}% slot đã đăng ký</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{count ? `${count} bib · từ ${formatVND(min)}` : "Chưa có bib"}</span>
                    {elig.required && (
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", elig.eligible ? "text-trail-700" : "text-amber-700")}>
                        {elig.eligible ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                        {elig.eligible ? "Đủ điều kiện" : "Cần điều kiện"}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Listings */}
          <section id="bibs" className="scroll-mt-24">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-xl font-bold">
                {shown.length} bib đang bán {activeDist && <span className="text-brand-600">· {distances.find((d) => d.id === activeDist)?.name}</span>}
              </h2>
              {activeDist && <Link href={`/races/${slug}`} scroll={false} className="text-sm font-medium text-brand-700">Xem tất cả cự ly</Link>}
            </div>
            {shown.length ? (
              <div className="space-y-3">{shown.map((l) => <ListingRow key={l.id} l={l} />)}</div>
            ) : (
              <EmptyState icon={<BellRing className="size-5" />} title="Chưa có bib phù hợp" body={`${wtb.length} runner khác cũng đang chờ. Bật thông báo để là người đầu tiên biết khi có bib.`} />
            )}
          </section>

          <Card>
            <CardHeader title="Về giải chạy" />
            <p className="p-5 text-sm leading-relaxed text-stone-600">{race.description}</p>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-brand-50 p-3">
                <p className="text-2xl font-extrabold text-brand-700">{Math.max(0, days)}</p>
                <p className="text-xs text-muted">ngày đến race</p>
              </div>
              <div className={cn("rounded-xl p-3", deadlineDays < 7 ? "bg-rose-50" : "bg-stone-50")}>
                <p className={cn("text-2xl font-extrabold", deadlineDays < 7 ? "text-rose-600" : "text-ink")}>{Math.max(0, deadlineDays)}</p>
                <p className="text-xs text-muted">ngày hết hạn đổi tên</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li className="flex justify-between"><span>Phí đổi tên BTC</span><span className="font-medium text-ink">{race.transferFee ? formatVND(race.transferFee) : "Miễn phí"}</span></li>
              <li className="flex justify-between"><span>Trần giá bán lại</span><span className="font-medium text-ink">{race.priceCapPct}% giá gốc</span></li>
              <li className="flex justify-between"><span>Người đang tìm bib</span><span className="font-medium text-ink">{wtb.length}</span></li>
            </ul>
            {race.transferPolicy !== "closed" && (
              <div className="mt-4 grid gap-2">
                <ButtonLink href={`/sell?race=${race.id}`} variant="secondary"><Ticket className="size-4" /> Bán bib giải này</ButtonLink>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-2 font-semibold"><BellRing className="size-4 text-brand-600" /> Báo khi có bib</p>
            <p className="mt-1 text-sm text-muted">Nhận thông báo ngay khi có bib đúng cự ly & mức giá.</p>
            {user ? (
              <AlertForm raceId={race.id} distances={distances.map((d) => ({ id: d.id, name: d.name, price: d.originalPrice }))} />
            ) : (
              <ButtonLink href={`/login?next=/races/${slug}`} variant="outline" className="mt-3 w-full">Đăng nhập để bật thông báo</ButtonLink>
            )}
          </Card>

          {services.length > 0 && (
            <Card className="p-5">
              <p className="font-semibold">Dịch vụ race-day</p>
              <ul className="mt-3 space-y-3">
                {services.slice(0, 4).map((s) => (
                  <li key={s.id} className="text-sm">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted">{s.type === "insurance" ? "≈ 6% giá bib" : formatVND(s.price)} · thêm khi thanh toán</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <AdSlot placement="race_sidebar" target={race.type} variant="card" />
        </aside>
      </div>
    </div>
  );
}

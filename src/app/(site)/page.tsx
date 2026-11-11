import Link from "next/link";
import { ArrowRight, BadgeCheck, Banknote, Building2, FileCheck2, Handshake, HeartPulse, Megaphone, Mountain, Search, ShieldCheck, Sparkles, Timer, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { AdSlot } from "@/components/market/ad-slot";
import { ListingTile } from "@/components/market/listing-card";
import { RaceCard } from "@/components/market/race-card";
import { RaceCover } from "@/components/market/race-cover";
import { HERO_PHOTO, photoUrl } from "@/lib/images";
import { getHotListings, getRaceCards } from "@/lib/services/catalog";
import { marketInsights } from "@/lib/services/insights";
import { formatCompactVND, formatNumber } from "@/lib/utils";

export default async function HomePage() {
  const [hot, races, m] = await Promise.all([getHotListings(8), getRaceCards({ sort: "listings" }), marketInsights()]);
  const featured = races.slice(0, 6);
  const trail = races.filter((r) => r.type === "trail").slice(0, 3);
  const steps = [
    { icon: Search, title: "Chọn bib", body: "Bib đã xác minh, giá minh bạch, có trần giá chống phe vé." },
    { icon: Banknote, title: "Thanh toán escrow", body: "Tiền được KBIB giữ, người bán chưa nhận ngay." },
    { icon: FileCheck2, title: "Đổi tên chính thức", body: "Yêu cầu gửi thẳng BTC qua API, nhận mã bib mới." },
    { icon: BadgeCheck, title: "Xác nhận", body: "Bạn xác nhận đã đứng tên (tự động sau 72h)." },
    { icon: HeartPulse, title: "Giải ngân & về đích", body: "Người bán nhận tiền. Bạn nhận voucher & bảo hiểm." },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-sunrise relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur">
              <ShieldCheck className="size-3.5" /> Escrow · Đổi tên chính thức với BTC
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              Pass bib an toàn.
              <br />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text text-transparent">Chạy đúng tên.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-600">
              Sàn chuyển nhượng bib Road & Trail cho 100+ giải mỗi năm. Tiền được giữ đến khi bạn đứng tên trên danh sách BTC.
            </p>

            <form action="/races" className="mt-8 rounded-2xl border border-line bg-white p-2 shadow-lift sm:flex sm:items-center sm:gap-2">
              <label className="flex flex-1 items-center gap-2 px-3">
                <Search className="size-5 shrink-0 text-brand-500" />
                <span className="sr-only">Tìm giải chạy</span>
                <input name="q" placeholder="Tìm giải, thành phố… (vd: Sapa, Hà Nội)" className="h-12 w-full bg-transparent text-base outline-none placeholder:text-stone-400" />
              </label>
              <div className="flex gap-2 p-1 sm:p-0">
                <select name="type" className="field h-12 w-auto rounded-xl" aria-label="Loại giải" defaultValue="">
                  <option value="">Road & Trail</option>
                  <option value="road">Road</option>
                  <option value="trail">Trail</option>
                </select>
                <button className="h-12 flex-1 rounded-xl bg-brand-600 px-6 font-semibold text-white transition hover:bg-brand-700 sm:flex-none">Tìm bib</button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {[["/races?type=road", "Marathon 42K"], ["/races?type=trail", "Trail Ultra 70K+"], ["/races?region=north", "Miền Bắc"], ["/races?region=south", "Miền Nam"], ["/races?region=highland", "Tây Nguyên"]].map(([href, label]) => (
                <Link key={label} href={href} className="rounded-full border border-line bg-white/80 px-3 py-1.5 font-medium text-stone-600 hover:border-brand-300 hover:text-brand-700">
                  {label}
                </Link>
              ))}
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
                [formatNumber(m.totals.activeListings), "bib đang bán"],
                [formatCompactVND(m.totals.gmv), "đã giao dịch an toàn"],
                [formatNumber(m.totals.seekers), "runner đang tìm bib"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-extrabold tabular-nums text-ink sm:text-3xl">{v}</dt>
                  <dd className="text-xs text-muted sm:text-sm">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero visual */}
          <div className="relative hidden lg:block">
            <div className="absolute -right-10 -top-6 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white shadow-lift">
              <div className="relative aspect-[4/3]">
                <RaceCover type="trail" seed="hero" coverUrl={photoUrl(HERO_PHOTO)} label={HERO_PHOTO.alt} sizes="(min-width: 1024px) 560px, 0px" priority />
              </div>
              <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted">Đơn KB-2611 · Sapa Ultra Trail 70K</p>
                    <p className="font-bold">Đổi tên thành công ✓</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Giải ngân</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="h-1.5 flex-1 rounded-full bg-brand-500" />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -left-8 top-10 w-56 rounded-2xl border border-line bg-white p-3 shadow-lift">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-trail-700"><Mountain className="size-3.5" /> Kiểm tra điều kiện Ultra</p>
              <p className="mt-1 text-xs text-muted">ITRA 3 điểm · Đã hoàn thành 50K</p>
              <p className="mt-2 rounded-lg bg-trail-50 px-2 py-1 text-xs font-semibold text-trail-700">Đủ điều kiện 70K ✓</p>
            </div>
            <div className="absolute -bottom-6 right-8 flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2 shadow-lift">
              <ShieldCheck className="size-5 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold">Tiền đang giữ an toàn</p>
                <p className="text-[11px] text-muted">Giải ngân khi bạn xác nhận</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hot listings */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Đang hot</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Bib nổi bật hôm nay</h2>
          </div>
          <Link href="/races" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2">Xem tất cả <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hot.map((l) => <ListingTile key={l.id} l={l} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdSlot placement="home_hero" />
      </section>

      {/* Races */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Sắp diễn ra</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Giải chạy nhiều bib nhất</h2>
          </div>
          <Link href="/races" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:gap-2">Lịch giải <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((r) => <RaceCard key={r.id} race={r} />)}
        </div>
      </section>

      {/* Escrow steps */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Escrow 5 bước</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Không còn nỗi lo bib giả, chạy sai tên</h2>
            <p className="mt-3 text-muted">Người bán chỉ nhận tiền khi bạn đã chính thức đứng tên trên danh sách của Ban tổ chức.</p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-5">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                {i < steps.length - 1 && <span className="absolute left-12 right-0 top-6 hidden h-px bg-gradient-to-r from-brand-300 to-transparent md:block" />}
                <span className="relative grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-4 ring-white">
                  <s.icon className="size-5" />
                </span>
                <p className="mt-4 text-xs font-bold text-brand-600">BƯỚC {i + 1}</p>
                <p className="mt-0.5 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Trail spotlight */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-trail-700 via-trail-600 to-emerald-500 p-6 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Mountain className="size-3.5" /> Trail & Ultra</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Mua bib Ultra đúng sức – an toàn trên núi</h2>
              <p className="mt-3 text-white/85">
                KBIB đối chiếu điểm ITRA, UTMB Index và lịch sử về đích (Strava/Garmin) trước khi cho phép mua bib 70K, 100K. Kèm combo xe + homestay, bảo hiểm cứu hộ.
              </p>
              <ButtonLink href="/races?type=trail" variant="outline" className="mt-6 border-white/0 text-trail-700">
                Khám phá giải Trail <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {trail.map((r) => (
                <Link key={r.id} href={`/races/${r.slug}`} className="group overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 transition hover:bg-white/20">
                  <div className="relative aspect-[4/3]"><RaceCover type="trail" seed={r.id} coverUrl={r.coverUrl} label={r.name} sizes="(min-width: 640px) 220px, 100vw" /></div>
                  <div className="p-3">
                    <p className="line-clamp-1 text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-white/75">{r.distances.map((d) => d.name).join(" · ")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Hệ sinh thái</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Một nền tảng – bốn nhóm đối tác</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, title: "Ban tổ chức", body: "API đổi tên, bán suất late-bird/charity, chia sẻ phí chuyển nhượng, dữ liệu runner.", href: "/partners#organizer" },
            { icon: Megaphone, title: "Thương hiệu", body: "Quảng cáo theo cự ly, voucher sau giao dịch, báo cáo xu hướng thị trường.", href: "/partners#brand" },
            { icon: Handshake, title: "Đại lý & Trung gian", body: "Hoa hồng giới thiệu, nhận ủy thác bán hộ, hỗ trợ khách đổi tên.", href: "/partners#agent" },
            { icon: Users, title: "Dịch vụ race-day", body: "Xe, khách sạn, nhận hộ kit, bảo hiểm – bán ngay trong checkout.", href: "/partners#partner" },
          ].map((c) => (
            <Link key={c.title} href={c.href} className="group card p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600"><c.icon className="size-5" /></span>
              <p className="mt-4 font-semibold group-hover:text-brand-700">{c.title}</p>
              <p className="mt-1 text-sm text-muted">{c.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-white sm:px-12">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-brand-500/40 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Không chạy được nữa? Đừng để bib nằm im.</h2>
              <p className="mt-2 max-w-xl text-white/70">Đăng bán trong 2 phút, hoặc để chuyên viên KBIB bán hộ trọn gói – bạn chỉ việc nhận tiền.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/sell" size="lg"><Sparkles className="size-4" /> Đăng bán ngay</ButtonLink>
              <ButtonLink href="/sell?mode=concierge" size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Timer className="size-4" /> Bán hộ nhanh</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

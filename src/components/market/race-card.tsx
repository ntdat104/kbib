import Link from "next/link";
import { CalendarDays, MapPin, Mountain, Users } from "lucide-react";
import type { RaceCard as RaceCardData } from "@/lib/services/catalog";
import { daysUntil, formatDate, formatVND } from "@/lib/utils";
import { RaceCover } from "./race-cover";
import { TypeBadge } from "./bits";

export function RaceCard({ race }: { race: RaceCardData }) {
  const days = daysUntil(race.date);
  const maxElev = Math.max(0, ...race.distances.map((d) => d.elevationGain));
  return (
    <Link href={`/races/${race.slug}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[16/8] overflow-hidden">
        <RaceCover type={race.type} seed={race.id} coverUrl={race.coverUrl} className="transition duration-500 group-hover:scale-105" label={race.name} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <TypeBadge type={race.type} />
          {race.featured && <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-brand-700">★ Hot</span>}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-ink/75 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur">
          {days > 0 ? `còn ${days} ngày` : "Đã diễn ra"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-semibold text-ink group-hover:text-brand-700">{race.name}</h3>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" />{formatDate(race.date)}</span>
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{race.city}</span>
          {maxElev > 0 && <span className="inline-flex items-center gap-1"><Mountain className="size-3.5" />{maxElev.toLocaleString("vi-VN")}m D+</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {race.distances.map((d) => (
            <span key={d.id} className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold text-stone-600">{d.name}</span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted">{race.activeListings ? `${race.activeListings} bib đang bán` : "Chưa có bib"}</p>
            <p className="font-bold tabular-nums text-ink">{race.minPrice ? `từ ${formatVND(race.minPrice)}` : "Đăng ký báo khi có"}</p>
          </div>
          {race.wtbCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
              <Users className="size-3" />
              {race.wtbCount} người tìm
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

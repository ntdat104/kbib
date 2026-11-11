import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { AdSlot } from "@/components/market/ad-slot";
import { CheckoutForm } from "@/components/market/checkout-form";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { checkEligibility, getListing } from "@/lib/services/catalog";
import { quote, servicePrice } from "@/lib/services/pricing";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Thanh toán an toàn" };

export default async function CheckoutPage({ params }: PageProps<"/checkout/[listingId]">) {
  const { listingId } = await params;
  const user = await requireUser(`/checkout/${listingId}`);
  const l = await getListing(listingId);
  if (!l) notFound();
  if (l.status !== "active") redirect(`/listings/${l.id}`);
  const s = await getSettings();
  const consignment = l.consignmentId ? await db.consignments.get(l.consignmentId) : null;
  const q = quote(s, l.kind, l.price, 0, consignment?.feePct);
  const services = (await db.services.where((x) => x.active && (x.raceId === "" || x.raceId === l.raceId))).map((x) => ({
    id: x.id, type: x.type, name: x.name, description: x.description, price: servicePrice(s, x, l.price),
  }));
  const elig = checkEligibility(l.distance, user);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Thanh toán an toàn</h1>
      <p className="mt-1 text-sm text-muted">Bước 1/3 · Thông tin vận động viên để BTC đổi tên chính thức</p>
      {!elig.eligible ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-5" /> Bạn chưa đủ điều kiện cho cự ly {l.distance.name}</p>
          <ul className="mt-2 list-inside list-disc text-sm">{elig.reqs.filter((r) => !r.ok).map((r) => <li key={r.label}>{r.label}</li>)}</ul>
          <p className="mt-2 text-sm">Đây là yêu cầu an toàn của BTC cho cự ly ultra. Cập nhật hồ sơ năng lực (ITRA/UTMB/Strava) để tiếp tục.</p>
          <ButtonLink href="/dashboard/profile" className="mt-4">Cập nhật hồ sơ</ButtonLink>
        </div>
      ) : (
        <CheckoutForm
          listing={{ id: l.id, race: l.race.name, date: l.race.date, distance: l.distance.name, seller: l.seller.name, kind: l.kind }}
          quote={q}
          services={services}
          prefill={{ fullName: user.name, phone: user.phone }}
          ad={<AdSlot placement="checkout" target={l.race.type} variant="card" />}
        />
      )}
    </div>
  );
}

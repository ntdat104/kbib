"use client";

import { useActionState, useState, type ReactNode } from "react";
import { BedDouble, Bus, Lock, Package, ShieldCheck, ShieldPlus } from "lucide-react";
import { checkoutAction } from "@/lib/actions/market";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import type { Quote } from "@/lib/services/pricing";
import type { ServiceType } from "@/lib/types";
import { formatDate, formatVND } from "@/lib/utils";

const ICON: Record<ServiceType, typeof Bus> = { insurance: ShieldPlus, kit_pickup: Package, travel: Bus, hotel: BedDouble };

export function CheckoutForm({ listing, quote, services, prefill, ad }: {
  listing: { id: string; race: string; date: string; distance: string; seller: string; kind: string };
  quote: Quote;
  services: { id: string; type: ServiceType; name: string; description: string; price: number }[];
  prefill: { fullName: string; phone: string };
  ad: ReactNode;
}) {
  const [state, action] = useActionState(checkoutAction, {});
  const [picked, setPicked] = useState<string[]>(services.filter((s) => s.type === "insurance").map((s) => s.id));
  const addons = services.filter((s) => picked.includes(s.id)).reduce((a, s) => a + s.price, 0);
  const total = quote.total + addons;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <form action={action} className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="listingId" value={listing.id} />
      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Thông tin vận động viên</h2>
          <p className="mt-1 text-sm text-muted">Phải khớp CCCD – BTC dùng thông tin này để in bib và mua bảo hiểm.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên trên CCCD" htmlFor="fullName"><input id="fullName" name="fullName" defaultValue={prefill.fullName} required className="field" autoComplete="name" /></Field>
            <Field label="Số CCCD" htmlFor="idNumber"><input id="idNumber" name="idNumber" required inputMode="numeric" pattern="\d{9,12}" className="field" /></Field>
            <Field label="Ngày sinh" htmlFor="dob"><input id="dob" name="dob" type="date" required className="field" /></Field>
            <Field label="Giới tính" htmlFor="gender">
              <select id="gender" name="gender" className="field"><option value="male">Nam</option><option value="female">Nữ</option></select>
            </Field>
            <Field label="Số điện thoại" htmlFor="phone"><input id="phone" name="phone" defaultValue={prefill.phone} required inputMode="tel" className="field" autoComplete="tel" /></Field>
            <Field label="Size áo" htmlFor="shirtSize">
              <select id="shirtSize" name="shirtSize" className="field" defaultValue="M">{["XS", "S", "M", "L", "XL", "XXL"].map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Liên hệ khẩn cấp (tên – SĐT)" htmlFor="emergencyContact" className="sm:col-span-2"><input id="emergencyContact" name="emergencyContact" required className="field" placeholder="Nguyễn Văn A – 0912 345 678" /></Field>
          </div>
        </section>

        {services.length > 0 && (
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold">Dịch vụ race-day</h2>
            <p className="mt-1 text-sm text-muted">Đặt cùng bib để được giá ưu đãi từ đối tác KBIB.</p>
            <div className="mt-4 grid gap-3">
              {services.map((s) => {
                const Icon = ICON[s.type];
                const on = picked.includes(s.id);
                return (
                  <label key={s.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${on ? "border-brand-500 bg-brand-50/60" : "border-line hover:border-brand-200"}`}>
                    <input type="checkbox" name="services" value={s.id} checked={on} onChange={() => toggle(s.id)} className="mt-1 size-4 accent-brand-600" />
                    <Icon className="mt-0.5 size-5 shrink-0 text-brand-600" />
                    <span className="flex-1">
                      <span className="flex justify-between gap-2 text-sm font-semibold"><span>{s.name}</span><span className="tabular-nums">{formatVND(s.price)}</span></span>
                      <span className="mt-0.5 block text-xs text-muted">{s.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        )}
        {ad}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Đơn hàng</p>
          <p className="mt-1 font-semibold">{listing.race}</p>
          <p className="text-sm text-muted">{listing.distance} · {formatDate(listing.date)} · Người bán: {listing.seller}</p>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Giá bib</dt><dd className="tabular-nums">{formatVND(quote.price)}</dd></div>
            {quote.buyerFee > 0 && <div className="flex justify-between"><dt className="text-muted">Phí dịch vụ</dt><dd className="tabular-nums">{formatVND(quote.buyerFee)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Phí escrow</dt><dd className="tabular-nums">{formatVND(quote.escrowFee)}</dd></div>
            {addons > 0 && <div className="flex justify-between"><dt className="text-muted">Dịch vụ thêm</dt><dd className="tabular-nums">{formatVND(addons)}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-semibold">Tổng thanh toán</dt><dd className="text-2xl font-extrabold tabular-nums text-brand-700">{formatVND(total)}</dd></div>
          </dl>
          <label className="mt-4 flex gap-2 text-xs text-stone-600">
            <input type="checkbox" name="agree" required className="mt-0.5 accent-brand-600" />
            <span>Tôi đồng ý điều khoản chuyển nhượng: thông tin chính xác, bib chỉ dùng cho người đứng tên, không bán lại vượt trần giá.</span>
          </label>
          <div className="mt-4 space-y-3">
            <FormMessage state={state} />
            <SubmitButton size="lg" className="w-full" pendingText="Đang giữ bib…"><Lock className="size-4" /> Giữ bib & thanh toán</SubmitButton>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            Bib được giữ cho bạn 30 phút. Tiền chỉ chuyển cho người bán khi bạn đã chính thức đứng tên.
          </p>
        </div>
      </aside>
    </form>
  );
}

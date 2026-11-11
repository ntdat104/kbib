"use client";

import { useActionState } from "react";
import { Rocket, TrendingUp } from "lucide-react";
import { promoteAction, updatePriceAction } from "@/lib/actions/market";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { formatVND } from "@/lib/utils";

const PKGS = [
  { key: "top24h", label: "Top 24 giờ" },
  { key: "top72h", label: "Top 72 giờ" },
  { key: "featured7d", label: "Nổi bật 7 ngày" },
];

export function OwnerTools({ id, price, cap, promoPrices, promotedUntil, suggestion }: {
  id: string; price: number; cap: number; promoPrices: Record<string, number>; promotedUntil: string;
  suggestion: { median: number; samples: number; original: number } | null;
}) {
  const [pState, promote] = useActionState(promoteAction, {});
  const [eState, edit] = useActionState(updatePriceAction, {});
  const active = promotedUntil && new Date(promotedUntil) > new Date();
  return (
    <div className="card space-y-5 p-5">
      <div>
        <p className="flex items-center gap-2 font-semibold"><Rocket className="size-4 text-brand-600" /> Đẩy tin bán nhanh</p>
        {active && <p className="mt-1 text-xs text-emerald-700">Đang nổi bật đến {new Date(promotedUntil).toLocaleString("vi-VN")}</p>}
        <form action={promote} className="mt-3 space-y-2">
          <input type="hidden" name="id" value={id} />
          {PKGS.map((p, i) => (
            <label key={p.key} className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <span className="flex items-center gap-2"><input type="radio" name="pkg" value={p.key} defaultChecked={i === 1} className="accent-brand-600" />{p.label}</span>
              <span className="font-semibold tabular-nums">{formatVND(promoPrices[p.key])}</span>
            </label>
          ))}
          <SubmitButton className="w-full">Đẩy tin</SubmitButton>
          <FormMessage state={pState} />
        </form>
      </div>
      <div className="border-t border-line pt-5">
        <p className="flex items-center gap-2 font-semibold"><TrendingUp className="size-4 text-brand-600" /> Điều chỉnh giá</p>
        {suggestion && (
          <p className="mt-1 text-xs text-muted">
            Giá thị trường: <b className="text-ink">{formatVND(suggestion.median)}</b> {suggestion.samples ? `(${suggestion.samples} giao dịch)` : "(giá gốc)"}
          </p>
        )}
        <form action={edit} className="mt-3 flex gap-2">
          <input type="hidden" name="id" value={id} />
          <input name="price" type="number" defaultValue={price} max={cap} step={10000} className="field" aria-label="Giá mới" />
          <SubmitButton variant="dark">Lưu</SubmitButton>
        </form>
        <p className="hint">Tối đa {formatVND(cap)}</p>
        <div className="mt-2"><FormMessage state={eState} /></div>
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/lib/actions/portal";
import { Field, FormMessage, SubmitButton } from "@/components/ui/form";
import type { Settings } from "@/lib/services/settings";

const GROUPS: { title: string; keys: [keyof Settings, string][] }[] = [
  { title: "Phí giao dịch", keys: [["buyerFeePct", "Phí người mua (%)"], ["sellerFeePct", "Phí người bán (%)"], ["escrowFee", "Phí escrow (đ)"], ["transferSharePct", "Chia sẻ phí đổi tên BTC (%)"], ["officialCommissionPct", "Hoa hồng suất chính thức (%)"]] },
  { title: "Bán hộ & đối tác", keys: [["conciergeStandardPct", "Bán hộ tiêu chuẩn (%)"], ["conciergeExpressPct", "Bán hộ nhanh (%)"], ["brokerSharePct", "Trung gian hưởng (% phí bán hộ)"], ["agentSharePct", "Đại lý hưởng (% phí sàn)"]] },
  { title: "Add-on", keys: [["insurancePct", "Bảo hiểm (% giá bib)"], ["insuranceMin", "Bảo hiểm tối thiểu (đ)"]] },
  { title: "Đẩy tin & dữ liệu", keys: [["promoTop24h", "Top 24h (đ)"], ["promoTop72h", "Top 72h (đ)"], ["promoFeatured7d", "Nổi bật 7 ngày (đ)"], ["dataBasic", "Data Basic (đ/th)"], ["dataPro", "Data Pro (đ/th)"], ["dataEnterprise", "Data Enterprise (đ/th)"]] },
  { title: "Chống phe vé & escrow", keys: [["priceCapPct", "Trần giá mặc định (%)"], ["maxActiveListingsPerRace", "Tin tối đa / giải / người"], ["maxPurchasesPerDistance", "Bib tối đa / cự ly / người"], ["autoCompleteHours", "Tự giải ngân sau (giờ)"]] },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(saveSettingsAction, {});
  return (
    <form action={action} className="space-y-6">
      {GROUPS.map((g) => (
        <section key={g.title} className="card p-5">
          <h2 className="font-semibold">{g.title}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.keys.map(([k, label]) => (
              <Field key={k} label={label} htmlFor={k}><input id={k} name={k} type="number" step="any" defaultValue={settings[k]} className="field" /></Field>
            ))}
          </div>
        </section>
      ))}
      <div className="flex items-center gap-3"><SubmitButton>Lưu cấu hình</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}

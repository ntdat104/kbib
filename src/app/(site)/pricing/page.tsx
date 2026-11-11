import type { Metadata } from "next";
import { Ban, Check, Gauge, Lock, Scale, ShieldCheck, UserX } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/card";
import { getSettings, PROMO_PACKAGES } from "@/lib/services/settings";
import { formatVND } from "@/lib/utils";

export const metadata: Metadata = { title: "Phí & An toàn" };

export default async function PricingPage() {
  const s = await getSettings();
  const rows = [
    ["Người mua", `${s.buyerFeePct}% giá bib + ${formatVND(s.escrowFee)} phí escrow`, "Giữ tiền an toàn, xác thực bib, hỗ trợ đổi tên"],
    ["Người bán", `${s.sellerFeePct}% giá bán`, "Chỉ trừ khi bán thành công"],
    ["Bán hộ (Concierge)", `${s.conciergeStandardPct}% tiêu chuẩn · ${s.conciergeExpressPct}% bán nhanh`, "Thay phí người bán; chuyên viên làm mọi thủ tục"],
    ["Suất chính thức BTC", `${s.officialCommissionPct}% hoa hồng phân phối`, "Người mua không trả phí dịch vụ"],
    ["Bảo hiểm giải chạy", `${s.insurancePct}% giá bib (tối thiểu ${formatVND(s.insuranceMin)})`, "Hoàn tiền nếu chấn thương / giải huỷ"],
  ];
  const faq = [
    ["Khi nào người bán nhận tiền?", `Sau khi BTC duyệt đổi tên và người mua xác nhận, hoặc tự động sau ${s.autoCompleteHours} giờ nếu không có khiếu nại.`],
    ["Nếu BTC từ chối đổi tên?", "Đơn chuyển sang tranh chấp. Nếu lỗi không thuộc người mua, KBIB hoàn 100% số tiền đã thanh toán."],
    ["Vì sao có trần giá?", `Để ngăn phe vé đẩy giá. Mặc định tối đa ${s.priceCapPct}% giá gốc; BTC có thể điều chỉnh cho từng giải.`],
    ["Tôi có thể mua nhiều bib?", `Mỗi runner tối đa ${s.maxPurchasesPerDistance} bib/cự ly và mỗi người bán tối đa ${s.maxActiveListingsPerRace} tin/giải. Hệ thống tự gắn cờ tài khoản có hành vi gom bib.`],
    ["Bib trail ultra có gì khác?", "Cự ly 70K+ yêu cầu điểm ITRA / UTMB Index / thành tích cự ly dài – KBIB kiểm tra trước khi cho phép thanh toán."],
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader eyebrow="Minh bạch" title="Phí rõ ràng. Tiền an toàn." subtitle="Không phí đăng tin, không phí ẩn. Bạn chỉ trả khi giao dịch thành công." />
      <Card className="overflow-hidden">
        <table className="table-base">
          <thead><tr><th>Đối tượng</th><th>Phí</th><th className="hidden sm:table-cell">Bao gồm</th></tr></thead>
          <tbody>{rows.map(([a, b, c]) => <tr key={a}><td className="font-semibold">{a}</td><td className="tabular-nums">{b}</td><td className="hidden text-muted sm:table-cell">{c}</td></tr>)}</tbody>
        </table>
      </Card>

      <h2 className="mt-12 text-xl font-bold">Đẩy tin – bán nhanh hơn</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {Object.values(PROMO_PACKAGES).map((p) => (
          <Card key={p.key} className="p-5"><p className="font-semibold">{p.label}</p><p className="mt-1 text-2xl font-extrabold text-brand-700">{formatVND(s[p.key])}</p><p className="mt-1 text-sm text-muted">{p.desc}</p></Card>
        ))}
      </div>

      <h2 id="anti-scalping" className="mt-12 scroll-mt-24 text-xl font-bold">Lớp bảo vệ của KBIB</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          [Lock, "Escrow", "Tiền nằm trong tài khoản đảm bảo đến khi bạn đứng tên."],
          [ShieldCheck, "Đổi tên chính thức", "Kết nối API với BTC – mã bib mới được ghi nhận trên hệ thống."],
          [Scale, "Trần giá", `Giá bán lại ≤ ${s.priceCapPct}% giá gốc (tuỳ giải).`],
          [Ban, "Chống gom bib", "Giới hạn số bib mỗi tài khoản + phát hiện hành vi bất thường."],
          [Gauge, "Kiểm tra năng lực", "ITRA, UTMB Index, Strava cho cự ly ultra."],
          [UserX, "Xử lý tranh chấp ≤ 48h", "Đội ngũ trọng tài trung lập, hoàn tiền 100% nếu lỗi người bán."],
        ].map(([Icon, t, b]) => {
          const I = Icon as typeof Lock;
          return <Card key={t as string} className="p-5"><I className="size-5 text-brand-600" /><p className="mt-3 font-semibold">{t as string}</p><p className="mt-1 text-sm text-muted">{b as string}</p></Card>;
        })}
      </div>

      <h2 id="faq" className="mt-12 scroll-mt-24 text-xl font-bold">Câu hỏi thường gặp</h2>
      <div className="mt-4 space-y-2">
        {faq.map(([q, a]) => (
          <details key={q} className="card group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{q}<Check className="size-4 text-brand-500 transition group-open:rotate-45" /></summary>
            <p className="mt-2 text-sm text-muted">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

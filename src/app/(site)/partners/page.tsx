import type { Metadata } from "next";
import { Building2, Handshake, Megaphone, Truck, UserRoundCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Đối tác" };

export default async function PartnersPage() {
  const s = await getSettings();
  const blocks = [
    { id: "organizer", icon: Building2, title: "Ban tổ chức giải", role: "organizer", points: ["Cổng duyệt đổi tên + REST API, không còn xử lý thủ công qua email", `Nhận phí đổi tên; KBIB chỉ giữ ${s.transferSharePct}% phí dịch vụ`, `Bán suất Late-bird / Charity với hoa hồng ${s.officialCommissionPct}%`, "Trần giá & chống phe vé theo chính sách từng giải", "Báo cáo nhu cầu cự ly để định giá mùa sau"] },
    { id: "brand", icon: Megaphone, title: "Thương hiệu", role: "brand", points: ["Quảng cáo theo ngữ cảnh: trang chủ, trang giải, checkout, tìm kiếm", "Nhắm Road/Trail, cự ly 21K / 42K / ultra", "Voucher tặng sau giao dịch – chỉ trả CPA khi runner nhận", "Market Intelligence: xu hướng, giá, vùng miền"] },
    { id: "agent", icon: Handshake, title: "Đại lý", role: "agent", points: ["Link giới thiệu riêng, theo dõi khách hàng", `Nhận ${s.agentSharePct}% phí sàn từ mọi giao dịch của khách bạn giới thiệu`, "Đăng bib thay khách – khách vẫn được bảo vệ escrow"] },
    { id: "broker", icon: UserRoundCheck, title: "Trung gian pass bib", role: "broker", points: ["Nhận yêu cầu bán hộ từ hàng đợi", `Hưởng ${s.brokerSharePct}% phí bán hộ (${s.conciergeStandardPct}–${s.conciergeExpressPct}%)`, "Hỗ trợ khách đổi tên với BTC, tăng điểm uy tín"] },
    { id: "partner", icon: Truck, title: "Dịch vụ race-day", role: "partner", points: ["Xe khách, khách sạn, nhận hộ kit, bảo hiểm", "Hiển thị ngay trong checkout đúng giải, đúng thời điểm", "Thanh toán gộp – KBIB đối soát hoa hồng"] },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader eyebrow="Hệ sinh thái" title="Cùng KBIB phục vụ 1 triệu lượt runner mỗi năm" subtitle="Một nền tảng kết nối runner, ban tổ chức, thương hiệu và dịch vụ hậu cần." />
      <div className="grid gap-5 md:grid-cols-2">
        {blocks.map((b) => (
          <section key={b.id} id={b.id} className="card scroll-mt-24 p-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600"><b.icon className="size-5" /></span>
            <h2 className="mt-4 text-lg font-bold">{b.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">{b.points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" />{p}</li>)}</ul>
            <ButtonLink href={`/register?role=${b.role}`} variant="secondary" className="mt-5">Đăng ký {b.title.toLowerCase()}</ButtonLink>
          </section>
        ))}
      </div>
    </div>
  );
}

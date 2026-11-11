import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  const cols = [
    { title: "Sàn giao dịch", links: [["/races", "Tất cả giải chạy"], ["/races?type=trail", "Giải Trail"], ["/sell", "Đăng bán bib"], ["/sell?mode=concierge", "Dịch vụ bán hộ"]] },
    { title: "An toàn", links: [["/pricing", "Phí & Escrow"], ["/pricing#faq", "Câu hỏi thường gặp"], ["/pricing#anti-scalping", "Chống phe vé"]] },
    { title: "Đối tác", links: [["/partners#organizer", "Ban tổ chức"], ["/partners#brand", "Thương hiệu"], ["/partners#agent", "Đại lý & Trung gian"], ["/insights", "Dữ liệu thị trường"]] },
  ];
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">
            Sàn chuyển nhượng bib Road & Trail đầu tiên có escrow và đổi tên chính thức với Ban tổ chức. Chạy đúng tên – an tâm về đích.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold text-ink">{c.title}</p>
            <ul className="mt-3 space-y-2">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted hover:text-brand-700">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">© {new Date().getFullYear()} KBIB. Giữ tiền an toàn – đổi tên hợp lệ.</div>
    </footer>
  );
}

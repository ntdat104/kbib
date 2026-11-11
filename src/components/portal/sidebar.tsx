"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Building2, ClipboardList, Code2, Coins, Flag, Gauge, Gift, Handshake, LayoutDashboard, Megaphone, Package, Receipt,
  Scale, Settings, ShieldAlert, Tag, Ticket, Truck, User, Users, Wallet, BellRing, UserRoundCheck,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  Bell, Building2, ClipboardList, Code2, Coins, Flag, Gauge, Gift, Handshake, LayoutDashboard, Megaphone, Package, Receipt,
  Scale, Settings, ShieldAlert, Tag, Ticket, Truck, User, Users, Wallet, BellRing, UserRoundCheck,
};
type Item = [href: string, label: string, icon: keyof typeof ICONS];

const PERSONAL: Item[] = [
  ["/dashboard", "Tổng quan", "LayoutDashboard"],
  ["/dashboard/orders", "Đơn mua & bán", "Receipt"],
  ["/dashboard/listings", "Tin đăng", "Tag"],
  ["/dashboard/alerts", "Theo dõi bib", "BellRing"],
  ["/dashboard/wallet", "Ví & thanh toán", "Wallet"],
  ["/dashboard/vouchers", "Voucher", "Gift"],
  ["/dashboard/notifications", "Thông báo", "Bell"],
  ["/dashboard/profile", "Hồ sơ năng lực", "User"],
];

const ROLE_NAV: Partial<Record<Role, { title: string; items: Item[] }>> = {
  agent: { title: "Đại lý", items: [["/agent", "Cổng đại lý", "Handshake"]] },
  broker: { title: "Trung gian", items: [["/broker", "Hàng đợi bán hộ", "UserRoundCheck"]] },
  organizer: {
    title: "Ban tổ chức",
    items: [["/organizer", "Tổng quan", "Gauge"], ["/organizer/transfers", "Duyệt đổi tên", "ClipboardList"], ["/organizer/races", "Giải & suất chính thức", "Ticket"], ["/organizer/api", "API tích hợp", "Code2"]],
  },
  brand: { title: "Thương hiệu", items: [["/brand", "Quảng cáo & voucher", "Megaphone"]] },
  partner: { title: "Đối tác dịch vụ", items: [["/partner", "Dịch vụ & đơn", "Truck"]] },
  admin: {
    title: "Quản trị",
    items: [
      ["/admin", "Doanh thu", "Coins"], ["/admin/orders", "Đơn & escrow", "Receipt"], ["/admin/disputes", "Tranh chấp", "Scale"],
      ["/admin/payouts", "Chi trả", "Wallet"], ["/admin/listings", "Tin đăng", "Tag"], ["/admin/users", "Người dùng", "Users"],
      ["/admin/ads", "Quảng cáo", "Megaphone"], ["/admin/fraud", "Gian lận", "ShieldAlert"], ["/admin/settings", "Cấu hình phí", "Settings"],
    ],
  },
};

export function Sidebar({ role }: { role: Role }) {
  const path = usePathname();
  const sections = [
    ...(role === "admin"
      ? (["admin", "organizer", "broker", "agent", "brand", "partner"] as Role[]).map((r) => ROLE_NAV[r]!)
      : ROLE_NAV[role] ? [ROLE_NAV[role]!] : []),
    { title: "Cá nhân", items: PERSONAL },
  ];
  const isActive = (href: string) => path === href || (href.split("/").length > 2 && path.startsWith(`${href}/`));
  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 scrollbar-none lg:flex-col lg:gap-6 lg:overflow-visible lg:pb-0" aria-label="Điều hướng cổng">
      {sections.map((s) => (
        <div key={s.title} className="flex shrink-0 gap-1 lg:block">
          <p className="hidden px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted lg:block">{s.title}</p>
          {s.items.map(([href, label, icon]) => {
            const Icon = ICONS[icon];
            return (
              <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined}
                className={cn("flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive(href) ? "bg-brand-600 text-white shadow-soft" : "text-stone-600 hover:bg-brand-50 hover:text-brand-700")}>
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

import Link from "next/link";
import { Bell, ChevronDown, LogOut, Menu, Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { logoutAction } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/utils";
import { Avatar } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "./logo";

const NAV = [
  { href: "/races", label: "Giải chạy" },
  { href: "/races?type=trail", label: "Trail" },
  { href: "/sell", label: "Bán bib" },
  { href: "/insights", label: "Thị trường" },
  { href: "/pricing", label: "Phí & An toàn" },
  { href: "/partners", label: "Đối tác" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? (await db.notifications.where((n) => n.userId === user.id && !n.read)).length : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <details className="group relative lg:hidden">
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl hover:bg-stone-100" aria-label="Mở menu">
            <Menu className="size-5" />
          </summary>
          <nav className="absolute left-0 top-12 w-64 rounded-2xl border border-line bg-white p-2 shadow-lift">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-brand-50 hover:text-brand-700">
                {n.label}
              </Link>
            ))}
          </nav>
        </details>
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-brand-50 hover:text-brand-700">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/races" className="hidden size-10 place-items-center rounded-xl text-stone-600 hover:bg-stone-100 sm:grid" aria-label="Tìm giải chạy">
            <Search className="size-5" />
          </Link>
          {user ? (
            <>
              <Link href="/dashboard/notifications" className="relative grid size-10 place-items-center rounded-xl text-stone-600 hover:bg-stone-100" aria-label={`Thông báo (${unread} chưa đọc)`}>
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>
                )}
              </Link>
              <ButtonLink href="/sell" size="sm" className="hidden sm:inline-flex">
                <Plus className="size-4" />
                Đăng bán
              </ButtonLink>
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1 pr-2 hover:bg-stone-100">
                  <Avatar name={user.name} className="size-8" />
                  <ChevronDown className="hidden size-4 text-stone-500 sm:block" />
                </summary>
                <div className="absolute right-0 top-12 w-64 rounded-2xl border border-line bg-white p-2 shadow-lift">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user.orgName || user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email} · {ROLE_LABEL[user.role]}</p>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  {user.role !== "runner" && (
                    <Link href={ROLE_HOME[user.role]} className="block rounded-xl px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
                      Cổng {ROLE_LABEL[user.role]}
                    </Link>
                  )}
                  {[
                    ["/dashboard", "Tổng quan"],
                    ["/dashboard/orders", "Đơn mua & bán"],
                    ["/dashboard/listings", "Tin đăng của tôi"],
                    ["/dashboard/wallet", "Ví & thanh toán"],
                    ["/dashboard/profile", "Hồ sơ năng lực"],
                  ].map(([href, label]) => (
                    <Link key={href} href={href} className="block rounded-xl px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
                      {label}
                    </Link>
                  ))}
                  <form action={logoutAction}>
                    <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                      <LogOut className="size-4" /> Đăng xuất
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">Đăng nhập</ButtonLink>
              <ButtonLink href="/register" size="sm">Đăng ký</ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import clsx, { type ClassValue } from "clsx";
import type { OrderStatus, RaceType, Region, Role } from "./types";

export const cn = (...v: ClassValue[]) => clsx(v);

const vnd = new Intl.NumberFormat("vi-VN");
export const formatVND = (n: number) => `${vnd.format(Math.round(n))}đ`;
export const formatCompactVND = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1).replace(".0", "")} tỷ`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1).replace(".0", "")} tr`;
  if (a >= 1e3) return `${Math.round(n / 1e3)}k`;
  return `${n}`;
};
export const formatNumber = (n: number) => vnd.format(n);

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", opts) : "—";
export const formatDateTime = (iso: string) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—";

export function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const nowIso = () => new Date().toISOString();
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
export const addHours = (d: Date, n: number) => new Date(d.getTime() + n * 3600000);

export const REGION_LABEL: Record<Region, string> = {
  north: "Miền Bắc",
  central: "Miền Trung",
  south: "Miền Nam",
  highland: "Tây Nguyên",
};
export const TYPE_LABEL: Record<RaceType, string> = { road: "Road", trail: "Trail" };

export const ROLE_LABEL: Record<Role, string> = {
  runner: "Runner",
  agent: "Đại lý",
  broker: "Trung gian pass bib",
  organizer: "Ban tổ chức",
  brand: "Thương hiệu",
  partner: "Đối tác dịch vụ",
  admin: "Quản trị",
};

export const ROLE_HOME: Record<Role, string> = {
  runner: "/dashboard",
  agent: "/agent",
  broker: "/broker",
  organizer: "/organizer",
  brand: "/brand",
  partner: "/partner",
  admin: "/admin",
};

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending_payment: { label: "Chờ thanh toán", tone: "amber" },
  paid: { label: "Đã giữ tiền (escrow)", tone: "sky" },
  transferring: { label: "Đang đổi tên", tone: "violet" },
  transferred: { label: "Đã đổi tên", tone: "brand" },
  completed: { label: "Hoàn tất", tone: "emerald" },
  disputed: { label: "Tranh chấp", tone: "rose" },
  refunded: { label: "Đã hoàn tiền", tone: "stone" },
  cancelled: { label: "Đã huỷ", tone: "stone" },
};

export type Tone = "brand" | "emerald" | "amber" | "rose" | "sky" | "violet" | "stone" | "trail";

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function pct(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

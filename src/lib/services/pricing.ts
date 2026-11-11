import type { ListingKind, Service } from "@/lib/types";
import type { Settings } from "./settings";

export interface Quote {
  price: number;
  buyerFee: number;
  sellerFee: number;
  escrowFee: number;
  addonsTotal: number;
  total: number;
  sellerPayout: number;
  platformRevenue: number;
}

/**
 * Fee model:
 *  - resale:      buyer fee % + seller fee % + flat escrow fee (paid by buyer)
 *  - official:    organizer inventory; platform takes officialCommissionPct from organizer side, buyer pays escrow only
 *  - consignment: seller pays concierge fee (15–20%) instead of seller fee; buyer pays normal buyer fee
 */
export function quote(
  s: Settings,
  kind: ListingKind,
  price: number,
  addonsTotal = 0,
  conciergePct = s.conciergeStandardPct,
): Quote {
  const buyerFee = kind === "official" ? 0 : Math.round((price * s.buyerFeePct) / 100);
  const sellerFeePct =
    kind === "official" ? s.officialCommissionPct : kind === "consignment" ? conciergePct : s.sellerFeePct;
  const sellerFee = Math.round((price * sellerFeePct) / 100);
  const escrowFee = s.escrowFee;
  const total = price + buyerFee + escrowFee + addonsTotal;
  return {
    price,
    buyerFee,
    sellerFee,
    escrowFee,
    addonsTotal,
    total,
    sellerPayout: price - sellerFee,
    platformRevenue: buyerFee + sellerFee + escrowFee,
  };
}

export function servicePrice(s: Settings, svc: Pick<Service, "type" | "price">, bibPrice: number) {
  if (svc.type === "insurance") return Math.max(s.insuranceMin, Math.round((bibPrice * s.insurancePct) / 100));
  return svc.price;
}

export function maxAllowedPrice(originalPrice: number, capPct: number) {
  return Math.floor((originalPrice * capPct) / 100 / 1000) * 1000;
}

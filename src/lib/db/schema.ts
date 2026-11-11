import type * as T from "@/lib/types";

/**
 * Single source of truth for the storage layout. Each table maps to one Google Sheet tab
 * whose first row is the header. Column order here is the order created by `sheets:setup`;
 * the driver maps by header name, so re-ordering or adding columns in the sheet is safe.
 */
export type Kind = "string" | "number" | "boolean" | "json";
type Cols<R> = { [K in keyof R]: Kind };

const users: Cols<T.User> = {
  id: "string", email: "string", passwordHash: "string", name: "string", phone: "string",
  role: "string", status: "string", region: "string", referralCode: "string", referredBy: "string",
  orgName: "string", apiKey: "string", itraPoints: "number", utmbIndex: "number",
  longestRaceKm: "number", stravaConnected: "boolean", verified: "boolean", trustScore: "number",
  bankName: "string", bankAccount: "string", createdAt: "string",
};
const races: Cols<T.Race> = {
  id: "string", slug: "string", name: "string", type: "string", city: "string", region: "string",
  date: "string", organizerId: "string", description: "string", transferPolicy: "string",
  transferDeadline: "string", transferFee: "number", priceCapPct: "number", featured: "boolean",
  status: "string", hue: "number", coverUrl: "string", createdAt: "string",
};
const distances: Cols<T.Distance> = {
  id: "string", raceId: "string", name: "string", km: "number", elevationGain: "number",
  originalPrice: "number", capacity: "number", registered: "number", requiredItraPoints: "number",
  requiredUtmbIndex: "number", requiredLongestKm: "number", cutoffHours: "number",
};
const listings: Cols<T.Listing> = {
  id: "string", raceId: "string", distanceId: "string", sellerId: "string", kind: "string",
  price: "number", originalPrice: "number", gender: "string", shirtSize: "string",
  includesKit: "boolean", note: "string", status: "string", promotedUntil: "string",
  agentId: "string", brokerId: "string", consignmentId: "string", quantity: "number",
  views: "number", createdAt: "string",
};
const orders: Cols<T.Order> = {
  id: "string", code: "string", listingId: "string", raceId: "string", distanceId: "string",
  buyerId: "string", sellerId: "string", kind: "string", price: "number", buyerFee: "number",
  sellerFee: "number", escrowFee: "number", addonsTotal: "number", total: "number",
  sellerPayout: "number", addons: "json", runnerInfo: "json", status: "string",
  paymentMethod: "string", paymentRef: "string", agentId: "string", agentCommission: "number",
  brokerId: "string", brokerCommission: "number", voucherId: "string", createdAt: "string",
  paidAt: "string", transferredAt: "string", completedAt: "string",
};
const transfers: Cols<T.Transfer> = {
  id: "string", orderId: "string", raceId: "string", distanceId: "string", fromUserId: "string",
  toUserId: "string", runnerInfo: "json", status: "string", organizerFee: "number",
  platformShare: "number", newBibCode: "string", reason: "string", handledBy: "string",
  createdAt: "string", handledAt: "string",
};
const wtb_alerts: Cols<T.WtbAlert> = {
  id: "string", userId: "string", raceId: "string", distanceId: "string", maxPrice: "number",
  status: "string", createdAt: "string",
};
const consignments: Cols<T.Consignment> = {
  id: "string", userId: "string", raceId: "string", distanceId: "string", desiredPrice: "number",
  tier: "string", feePct: "number", status: "string", brokerId: "string", listingId: "string",
  note: "string", createdAt: "string",
};
const promotions: Cols<T.Promotion> = {
  id: "string", listingId: "string", userId: "string", pkg: "string", price: "number",
  startAt: "string", endAt: "string", createdAt: "string",
};
const ad_campaigns: Cols<T.AdCampaign> = {
  id: "string", brandId: "string", name: "string", placement: "string", title: "string",
  body: "string", cta: "string", link: "string", target: "string", budget: "number", cpm: "number",
  impressions: "number", clicks: "number", status: "string", startAt: "string", endAt: "string",
  createdAt: "string",
};
const vouchers: Cols<T.Voucher> = {
  id: "string", brandId: "string", code: "string", title: "string", description: "string",
  discountText: "string", target: "string", minKm: "number", link: "string", quantity: "number",
  claimed: "number", cpa: "number", active: "boolean", createdAt: "string",
};
const user_vouchers: Cols<T.UserVoucher> = {
  id: "string", userId: "string", voucherId: "string", orderId: "string", createdAt: "string",
};
const services: Cols<T.Service> = {
  id: "string", partnerId: "string", raceId: "string", type: "string", name: "string",
  description: "string", price: "number", commissionPct: "number", active: "boolean",
  createdAt: "string",
};
const disputes: Cols<T.Dispute> = {
  id: "string", orderId: "string", openedBy: "string", reason: "string", detail: "string",
  status: "string", resolution: "string", createdAt: "string", resolvedAt: "string",
};
const payouts: Cols<T.Payout> = {
  id: "string", userId: "string", orderId: "string", type: "string", amount: "number",
  status: "string", createdAt: "string", paidAt: "string",
};
const ledger: Cols<T.LedgerEntry> = {
  id: "string", stream: "string", amount: "number", orderId: "string", refId: "string",
  raceId: "string", note: "string", createdAt: "string",
};
const reviews: Cols<T.Review> = {
  id: "string", orderId: "string", reviewerId: "string", revieweeId: "string", rating: "number",
  comment: "string", createdAt: "string",
};
const notifications: Cols<T.Notification> = {
  id: "string", userId: "string", title: "string", body: "string", link: "string",
  read: "boolean", createdAt: "string",
};
const data_subscriptions: Cols<T.DataSubscription> = {
  id: "string", userId: "string", plan: "string", price: "number", startAt: "string",
  endAt: "string", createdAt: "string",
};
const fraud_flags: Cols<T.FraudFlag> = {
  id: "string", userId: "string", reason: "string", severity: "string", status: "string",
  createdAt: "string",
};
const settings: Cols<T.Setting> = { id: "string", value: "string" };

export const schema = {
  users, races, distances, listings, orders, transfers, wtb_alerts, consignments, promotions,
  ad_campaigns, vouchers, user_vouchers, services, disputes, payouts, ledger, reviews,
  notifications, data_subscriptions, fraud_flags, settings,
};

export type TableName = keyof typeof schema;

export interface RowTypes {
  users: T.User; races: T.Race; distances: T.Distance; listings: T.Listing; orders: T.Order;
  transfers: T.Transfer; wtb_alerts: T.WtbAlert; consignments: T.Consignment;
  promotions: T.Promotion; ad_campaigns: T.AdCampaign; vouchers: T.Voucher;
  user_vouchers: T.UserVoucher; services: T.Service; disputes: T.Dispute; payouts: T.Payout;
  ledger: T.LedgerEntry; reviews: T.Review; notifications: T.Notification;
  data_subscriptions: T.DataSubscription; fraud_flags: T.FraudFlag; settings: T.Setting;
}

export const columnsOf = (table: TableName) => Object.keys(schema[table]);

export function encodeCell(kind: Kind, value: unknown): string {
  if (value === undefined || value === null) return "";
  if (kind === "json") return JSON.stringify(value);
  if (kind === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

export function decodeCell(kind: Kind, raw: string | undefined): unknown {
  const v = raw ?? "";
  switch (kind) {
    case "number": {
      const n = Number(v);
      return v === "" || Number.isNaN(n) ? 0 : n;
    }
    case "boolean":
      return v === "TRUE" || v === "true" || v === "1";
    case "json":
      if (!v) return null;
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    default:
      return v;
  }
}

export type Role = "runner" | "agent" | "broker" | "organizer" | "brand" | "partner" | "admin";
export type RaceType = "road" | "trail";
export type Region = "north" | "central" | "south" | "highland";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  role: Role;
  status: "active" | "suspended";
  region: Region | "";
  referralCode: string;
  referredBy: string; // agent referral code
  orgName: string; // organizer / brand / partner company name
  apiKey: string; // organizer API key
  itraPoints: number;
  utmbIndex: number;
  longestRaceKm: number;
  stravaConnected: boolean;
  verified: boolean; // KYC
  trustScore: number; // 0..100
  bankName: string;
  bankAccount: string;
  createdAt: string;
}

export interface Race {
  id: string;
  slug: string;
  name: string;
  type: RaceType;
  city: string;
  region: Region;
  date: string; // YYYY-MM-DD
  organizerId: string;
  description: string;
  transferPolicy: "official" | "allowed" | "closed";
  transferDeadline: string;
  transferFee: number; // organizer name-change fee
  priceCapPct: number; // max listing price as % of original
  featured: boolean;
  status: "published" | "draft" | "finished";
  hue: number; // accent seed
  coverUrl: string; // organizer-supplied cover image (https); empty = curated photo
  createdAt: string;
}

export interface Distance {
  id: string;
  raceId: string;
  name: string; // "42K", "70K"
  km: number;
  elevationGain: number;
  originalPrice: number;
  capacity: number;
  registered: number;
  requiredItraPoints: number;
  requiredUtmbIndex: number;
  requiredLongestKm: number;
  cutoffHours: number;
}

export type ListingKind = "resale" | "official" | "consignment";
export type ListingStatus = "active" | "reserved" | "sold" | "cancelled" | "expired";

export interface Listing {
  id: string;
  raceId: string;
  distanceId: string;
  sellerId: string;
  kind: ListingKind;
  price: number;
  originalPrice: number;
  gender: "male" | "female" | "any";
  shirtSize: string;
  includesKit: boolean;
  note: string;
  status: ListingStatus;
  promotedUntil: string;
  agentId: string; // listed by agent on behalf of runner
  brokerId: string;
  consignmentId: string;
  quantity: number; // >1 only for official inventory
  views: number;
  createdAt: string;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "transferring"
  | "transferred"
  | "completed"
  | "disputed"
  | "refunded"
  | "cancelled";

export interface OrderAddon {
  serviceId: string;
  type: ServiceType;
  name: string;
  price: number;
  commission: number;
  partnerId: string;
}

export interface RunnerInfo {
  fullName: string;
  dob: string;
  gender: string;
  idNumber: string;
  phone: string;
  shirtSize: string;
  emergencyContact: string;
}

export interface Order {
  id: string;
  code: string;
  listingId: string;
  raceId: string;
  distanceId: string;
  buyerId: string;
  sellerId: string;
  kind: ListingKind;
  price: number;
  buyerFee: number;
  sellerFee: number;
  escrowFee: number;
  addonsTotal: number;
  total: number; // buyer pays
  sellerPayout: number;
  addons: OrderAddon[];
  runnerInfo: RunnerInfo;
  status: OrderStatus;
  paymentMethod: "vietqr" | "sandbox" | "wallet";
  paymentRef: string;
  agentId: string;
  agentCommission: number;
  brokerId: string;
  brokerCommission: number;
  voucherId: string;
  createdAt: string;
  paidAt: string;
  transferredAt: string;
  completedAt: string;
}

export interface Transfer {
  id: string;
  orderId: string;
  raceId: string;
  distanceId: string;
  fromUserId: string;
  toUserId: string;
  runnerInfo: RunnerInfo;
  status: "requested" | "approved" | "rejected";
  organizerFee: number;
  platformShare: number;
  newBibCode: string;
  reason: string;
  handledBy: string;
  createdAt: string;
  handledAt: string;
}

export interface WtbAlert {
  id: string;
  userId: string;
  raceId: string;
  distanceId: string;
  maxPrice: number;
  status: "active" | "matched" | "closed";
  createdAt: string;
}

export interface Consignment {
  id: string;
  userId: string;
  raceId: string;
  distanceId: string;
  desiredPrice: number;
  tier: "standard" | "express";
  feePct: number;
  status: "new" | "assigned" | "listed" | "sold" | "cancelled";
  brokerId: string;
  listingId: string;
  note: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  listingId: string;
  userId: string;
  pkg: PromoPackage;
  price: number;
  startAt: string;
  endAt: string;
  createdAt: string;
}
export type PromoPackage = "top24h" | "top72h" | "featured7d";

export type AdPlacement = "home_hero" | "race_sidebar" | "checkout" | "search_top";
export interface AdCampaign {
  id: string;
  brandId: string;
  name: string;
  placement: AdPlacement;
  title: string;
  body: string;
  cta: string;
  link: string;
  target: RaceType | "all";
  budget: number;
  cpm: number;
  impressions: number;
  clicks: number;
  status: "pending" | "active" | "paused" | "ended";
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface Voucher {
  id: string;
  brandId: string;
  code: string;
  title: string;
  description: string;
  discountText: string;
  target: RaceType | "all";
  minKm: number;
  link: string;
  quantity: number;
  claimed: number;
  cpa: number; // brand pays platform per claimed voucher
  active: boolean;
  createdAt: string;
}

export interface UserVoucher {
  id: string;
  userId: string;
  voucherId: string;
  orderId: string;
  createdAt: string;
}

export type ServiceType = "insurance" | "kit_pickup" | "travel" | "hotel";
export interface Service {
  id: string;
  partnerId: string;
  raceId: string; // "" = all races
  type: ServiceType;
  name: string;
  description: string;
  price: number; // 0 for insurance → computed by % of bib
  commissionPct: number;
  active: boolean;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  openedBy: string;
  reason: string;
  detail: string;
  status: "open" | "resolved_buyer" | "resolved_seller";
  resolution: string;
  createdAt: string;
  resolvedAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  orderId: string;
  type: "seller_payout" | "agent_commission" | "broker_commission" | "refund";
  amount: number;
  status: "pending" | "paid";
  createdAt: string;
  paidAt: string;
}

export type RevenueStream =
  | "buyer_fee"
  | "seller_fee"
  | "escrow_fee"
  | "transfer_share"
  | "promotion"
  | "ads"
  | "concierge"
  | "addon_commission"
  | "insurance"
  | "official_commission"
  | "voucher"
  | "data_report"
  | "agent_commission"
  | "broker_commission";

export interface LedgerEntry {
  id: string;
  stream: RevenueStream;
  amount: number; // negative = cost shared out
  orderId: string;
  refId: string;
  raceId: string;
  note: string;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface DataSubscription {
  id: string;
  userId: string;
  plan: "basic" | "pro" | "enterprise";
  price: number;
  startAt: string;
  endAt: string;
  createdAt: string;
}

export interface FraudFlag {
  id: string;
  userId: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: "open" | "cleared" | "actioned";
  createdAt: string;
}

export interface Setting {
  id: string; // key
  value: string;
}

/* Demo data: 100 races (road + trail), users for every role, listings, orders across the escrow
 * lifecycle and a revenue ledger consistent with the services. Uses only Repo.replaceAll so it can
 * run inside db bootstrap. Deterministic (seeded PRNG). */
import { hashPassword } from "@/lib/auth/password";
import { orderRevenueEntries } from "@/lib/services/ledger";
import { DEFAULT_SETTINGS } from "@/lib/services/settings";
import type * as T from "@/lib/types";
import { slugify } from "@/lib/utils";
import { db } from "./index";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_PASSWORD = "kbib@123";

export async function seedAll() {
  const rand = rng(20261111);
  const pick = <X>(a: readonly X[]) => a[Math.floor(rand() * a.length)];
  const int = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));
  const round10k = (n: number) => Math.round(n / 10000) * 10000;
  let seq = 0;
  const id = (p: string) => `${p}_${(++seq).toString(36).padStart(5, "0")}`;
  const now = Date.now();
  const iso = (t: number) => new Date(t).toISOString();
  const day = 86400000;
  const pw = await hashPassword(DEMO_PASSWORD);

  /* ── Users ── */
  const users: T.User[] = [];
  const mkUser = (p: Partial<T.User>): T.User => {
    const u: T.User = {
      id: id("usr"), email: "", passwordHash: pw, name: "", phone: `09${int(10000000, 99999999)}`, role: "runner",
      status: "active", region: pick(["north", "central", "south", "highland"] as const), referralCode: "", referredBy: "",
      orgName: "", apiKey: "", itraPoints: 0, utmbIndex: 0, longestRaceKm: pick([10, 21, 21, 42, 42, 50]), stravaConnected: rand() > 0.5,
      verified: rand() > 0.3, trustScore: int(55, 95), bankName: "Vietcombank", bankAccount: String(int(1e9, 9e9)),
      createdAt: iso(now - int(30, 400) * day), ...p,
    };
    users.push(u);
    return u;
  };
  const admin = mkUser({ email: "admin@kbib.vn", name: "Quản trị KBIB", role: "admin", verified: true, trustScore: 100 });
  const organizers = [
    mkUser({ email: "btc@kbib.vn", name: "Nguyễn Minh Khang", orgName: "Sunrise Sports Events", role: "organizer", verified: true, apiKey: "kbib_org_demo_sunrise" }),
    mkUser({ email: "btc.trail@kbib.vn", name: "Lò Văn Sơn", orgName: "Highland Trail Co.", role: "organizer", verified: true, apiKey: "kbib_org_demo_highland" }),
    mkUser({ email: "btc.coastal@kbib.vn", name: "Trần Thu Hà", orgName: "Coastal Run Vietnam", role: "organizer", verified: true, apiKey: "kbib_org_demo_coastal" }),
  ];
  const agents = [
    mkUser({ email: "daily@kbib.vn", name: "Phạm Quốc Huy", role: "agent", referralCode: "AGHN01", verified: true, region: "north" }),
    mkUser({ email: "daily.sg@kbib.vn", name: "Lê Hoài Nam", role: "agent", referralCode: "AGSG02", verified: true, region: "south" }),
  ];
  const brokers = [
    mkUser({ email: "trunggian@kbib.vn", name: "Đỗ Thanh Tùng", role: "broker", verified: true, trustScore: 97 }),
    mkUser({ email: "trunggian2@kbib.vn", name: "Vũ Ngọc Anh", role: "broker", verified: true, trustScore: 93 }),
  ];
  const brands = [
    mkUser({ email: "brand@kbib.vn", name: "Hoàng Gia Bảo", orgName: "RunGear Vietnam", role: "brand", verified: true }),
    mkUser({ email: "brand.nutri@kbib.vn", name: "Mai Phương", orgName: "NutriFuel", role: "brand", verified: true }),
    mkUser({ email: "brand.watch@kbib.vn", name: "Kiều Anh", orgName: "PaceWatch", role: "brand", verified: true }),
  ];
  const partners = [
    mkUser({ email: "doitac@kbib.vn", name: "Bùi Văn Lực", orgName: "Bảo hiểm An Tâm", role: "partner", verified: true }),
    mkUser({ email: "doitac.travel@kbib.vn", name: "Đinh Thảo", orgName: "Mountain Bus & Stay", role: "partner", verified: true }),
    mkUser({ email: "doitac.kit@kbib.vn", name: "Tạ Minh", orgName: "KitRunner Express", role: "partner", verified: true }),
  ];
  const mainRunner = mkUser({
    email: "runner@kbib.vn", name: "Nguyễn Tiến Đạt", role: "runner", region: "north", itraPoints: 3, utmbIndex: 480,
    longestRaceKm: 50, stravaConnected: true, verified: true, trustScore: 88, referredBy: "AGHN01",
  });
  const ho = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
  const dem = ["Văn", "Thị", "Minh", "Đức", "Thu", "Ngọc", "Quang", "Hải", "Thanh", "Gia", "Bảo", "Anh"];
  const ten = ["An", "Bình", "Châu", "Dũng", "Giang", "Hiếu", "Khánh", "Linh", "Mai", "Nam", "Phúc", "Quân", "Sơn", "Trang", "Uyên", "Vy", "Yến", "Tuấn", "Long", "Hạnh"];
  const runners = [mainRunner];
  for (let i = 0; i < 70; i++) {
    const name = `${pick(ho)} ${pick(dem)} ${pick(ten)}`;
    const trailer = rand() > 0.55;
    runners.push(
      mkUser({
        email: `${slugify(name).replace(/-/g, ".")}${i}@mail.vn`, name,
        itraPoints: trailer ? int(0, 8) : 0, utmbIndex: trailer ? int(350, 620) : 0,
        longestRaceKm: trailer ? pick([42, 50, 70, 100]) : pick([10, 21, 42]),
        referredBy: rand() > 0.75 ? pick(["AGHN01", "AGSG02"]) : "",
      }),
    );
  }

  /* ── Races & distances ── */
  const roadCities: [string, T.Region][] = [
    ["Hà Nội", "north"], ["TP.HCM", "south"], ["Đà Nẵng", "central"], ["Huế", "central"], ["Quy Nhơn", "central"],
    ["Nha Trang", "central"], ["Hạ Long", "north"], ["Hải Phòng", "north"], ["Cần Thơ", "south"], ["Vũng Tàu", "south"],
    ["Phú Quốc", "south"], ["Hội An", "central"], ["Ninh Bình", "north"], ["Vinh", "central"], ["Buôn Ma Thuột", "highland"],
    ["Côn Đảo", "south"], ["Tây Ninh", "south"], ["Bình Dương", "south"], ["Phan Thiết", "south"], ["Quảng Bình", "central"],
  ];
  const roadSuffix = ["Marathon", "Half Marathon", "Night Run", "Heritage Marathon", "Coastal Marathon", "City Run"];
  const trailPlaces: [string, T.Region][] = [
    ["Sapa", "north"], ["Mộc Châu", "north"], ["Hà Giang", "north"], ["Đà Lạt", "highland"], ["Lâm Đồng", "highland"],
    ["Pù Luông", "north"], ["Mù Cang Chải", "north"], ["Ba Vì", "north"], ["Tà Xùa", "north"], ["Cao Bằng", "north"],
    ["Bạch Mã", "central"], ["Langbiang", "highland"], ["Phong Nha", "central"], ["Côn Sơn", "north"], ["Mẫu Sơn", "north"],
    ["Fansipan", "north"], ["Núi Chúa", "central"], ["Bidoup", "highland"], ["Y Tý", "north"], ["Lũng Cú", "north"],
  ];
  const trailSuffix = ["Ultra Trail", "Mountain Marathon", "Sky Race", "Jungle Trail"];

  const names = new Set<string>();
  const specs: { name: string; type: T.RaceType; city: string; region: T.Region }[] = [];
  while (specs.filter((s) => s.type === "road").length < 60) {
    const [city, region] = pick(roadCities);
    const name = `${city} ${pick(roadSuffix)}`;
    if (!names.has(name)) {
      names.add(name);
      specs.push({ name, type: "road", city, region });
    }
  }
  while (specs.filter((s) => s.type === "trail").length < 40) {
    const [city, region] = pick(trailPlaces);
    const name = `${city} ${pick(trailSuffix)}`;
    if (!names.has(name)) {
      names.add(name);
      specs.push({ name, type: "trail", city, region });
    }
  }

  const races: T.Race[] = [];
  const distances: T.Distance[] = [];
  const start = new Date("2026-10-10").getTime();
  specs
    .sort(() => rand() - 0.5)
    .forEach((s, i) => {
      // ~9 races already finished (Oct–Nov 2026), the rest spread over the next 12 months.
      const date = new Date(start + i * 3.6 * day + int(0, 2) * day);
      const dateStr = date.toISOString().slice(0, 10);
      const finished = date.getTime() < now;
      const r: T.Race = {
        id: id("race"), slug: slugify(`${s.name} ${date.getFullYear()}`), name: `${s.name} ${date.getFullYear()}`, type: s.type,
        city: s.city, region: s.region, date: dateStr, organizerId: s.type === "trail" ? (rand() > 0.3 ? organizers[1].id : organizers[0].id) : pick([organizers[0].id, organizers[2].id]),
        description:
          s.type === "trail"
            ? `Cung đường trail xuyên rừng nguyên sinh và sống núi ${s.city}, tổng leo cao lớn, cảnh quan ruộng bậc thang và biển mây. Trạm tiếp nước mỗi 8–12km, đội cứu hộ chuyên nghiệp.`
            : `Giải chạy đường phố qua các biểu tượng của ${s.city}. Đường đua được phong toả hoàn toàn, trạm nước mỗi 2.5km, đo thời gian chip, huy chương finisher.`,
        transferPolicy: rand() > 0.12 ? "official" : rand() > 0.5 ? "allowed" : "closed",
        transferDeadline: new Date(date.getTime() - int(10, 21) * day).toISOString().slice(0, 10),
        transferFee: pick([100000, 150000, 200000, 0]), priceCapPct: pick([110, 120, 120, 130]),
        featured: rand() > 0.85, status: finished ? "finished" : "published", hue: int(8, 34), coverUrl: "", createdAt: iso(now - 200 * day),
      };
      races.push(r);
      const set: [string, number, number, number][] =
        s.type === "road"
          ? [["5K", 5, 0, int(30, 45)], ["10K", 10, 0, int(45, 60)], ["21K", 21.1, 0, int(75, 100)], ["42K", 42.2, 0, int(100, 140)]]
          : [["15K", 15, int(600, 1200), int(60, 90)], ["30K", 30, int(1400, 2200), int(100, 140)], ["50K", 50, int(2500, 3500), int(160, 220)],
             ["70K", 70, int(3800, 5000), int(230, 300)], ...(rand() > 0.4 ? [["100K", 100, int(5500, 7500), int(320, 420)] as [string, number, number, number]] : [])];
      for (const [name, km, elev, priceK] of set) {
        distances.push({
          id: id("dst"), raceId: r.id, name, km, elevationGain: elev, originalPrice: priceK * 10000,
          capacity: s.type === "road" ? int(1500, 6000) : int(300, 1500), registered: 0,
          requiredItraPoints: km >= 100 ? 4 : km >= 70 ? 2 : 0, requiredUtmbIndex: km >= 100 ? 450 : 0,
          requiredLongestKm: km >= 100 ? 70 : km >= 70 ? 42 : 0, cutoffHours: Math.ceil(km / (s.type === "trail" ? 4.5 : 8)),
        });
      }
    });
  for (const d of distances) d.registered = Math.floor(d.capacity * (0.6 + rand() * 0.4));

  const upcoming = races.filter((r) => r.status === "published");
  const distOf = (r: T.Race) => distances.filter((d) => d.raceId === r.id);

  /* ── Active listings ── */
  const listings: T.Listing[] = [];
  const promotions: T.Promotion[] = [];
  const ledger: T.LedgerEntry[] = [];
  const pkgPrice = { top24h: DEFAULT_SETTINGS.promoTop24h, top72h: DEFAULT_SETTINGS.promoTop72h, featured7d: DEFAULT_SETTINGS.promoFeatured7d };
  for (const r of upcoming) {
    if (r.transferPolicy === "closed") continue;
    const n = r.featured ? int(5, 10) : int(0, 7);
    for (let i = 0; i < n; i++) {
      const d = pick(distOf(r));
      const seller = pick(runners.slice(1));
      const promoted = rand() > 0.85;
      const created = now - int(0, 25) * day - int(0, 23) * 3600000;
      const l: T.Listing = {
        id: id("lst"), raceId: r.id, distanceId: d.id, sellerId: seller.id, kind: "resale",
        price: Math.min(round10k(d.originalPrice * (0.8 + rand() * 0.4)), Math.floor((d.originalPrice * r.priceCapPct) / 100 / 1000) * 1000),
        originalPrice: d.originalPrice, gender: pick(["male", "female", "any"] as const), shirtSize: pick(["S", "M", "L", "XL"]),
        includesKit: rand() > 0.4, note: pick(["Bận công tác đột xuất, nhượng lại giá tốt.", "Chấn thương nhẹ, không kịp hồi phục.", "Đổi lịch gia đình, BTC hỗ trợ đổi tên.", "Đăng ký nhầm cự ly, cần pass gấp.", ""]),
        status: "active", promotedUntil: promoted ? iso(now + int(6, 120) * 3600000) : "", agentId: rand() > 0.9 ? agents[0].id : "",
        brokerId: "", consignmentId: "", quantity: 1, views: int(5, 400), createdAt: iso(created),
      };
      listings.push(l);
      if (promoted) {
        const pkg = pick(["top24h", "top72h", "featured7d"] as const);
        promotions.push({ id: id("pro"), listingId: l.id, userId: seller.id, pkg, price: pkgPrice[pkg], startAt: l.createdAt, endAt: l.promotedUntil, createdAt: l.createdAt });
        ledger.push({ id: id("led"), stream: "promotion", amount: pkgPrice[pkg], orderId: "", refId: l.id, raceId: r.id, note: pkg, createdAt: l.createdAt });
      }
    }
  }
  // Official late-bird / charity inventory from organizers
  for (const r of upcoming.filter((r) => r.transferPolicy !== "closed").slice(0, 14)) {
    const d = pick(distOf(r));
    listings.push({
      id: id("lst"), raceId: r.id, distanceId: d.id, sellerId: r.organizerId, kind: "official",
      price: round10k(d.originalPrice * pick([1.0, 1.1, 1.15])), originalPrice: d.originalPrice, gender: "any", shirtSize: "",
      includesKit: true, note: pick(["Suất Late-bird chính thức từ BTC.", "Suất Charity – 20% đóng góp quỹ trồng rừng."]),
      status: "active", promotedUntil: "", agentId: "", brokerId: "", consignmentId: "", quantity: int(5, 40), views: int(50, 900),
      createdAt: iso(now - int(1, 20) * day),
    });
  }

  /* ── Historical orders across the escrow lifecycle ── */
  const orders: T.Order[] = [];
  const transfers: T.Transfer[] = [];
  const payouts: T.Payout[] = [];
  const reviews: T.Review[] = [];
  const disputes: T.Dispute[] = [];
  const s = DEFAULT_SETTINGS;
  const eligibleRaces = races.filter((r) => r.transferPolicy !== "closed");
  for (let i = 0; i < 900; i++) {
    const r = pick(eligibleRaces);
    const d = pick(distOf(r));
    const raceT = new Date(r.date).getTime();
    const created = raceT - Math.floor(Math.pow(rand(), 1.6) * 100 + 3) * day - int(0, 23) * 3600000;
    if (created > now - 3600000 || created < now - 160 * day) continue;
    const buyer = i % 23 === 0 ? mainRunner : pick(runners);
    let seller = pick(runners);
    if (seller.id === buyer.id) seller = runners[(runners.indexOf(seller) + 1) % runners.length];
    const daysToRace = (raceT - created) / day;
    const price = Math.min(round10k(d.originalPrice * (daysToRace < 21 ? 1.0 + rand() * 0.25 : 0.85 + rand() * 0.25)), Math.floor((d.originalPrice * r.priceCapPct) / 100 / 1000) * 1000);
    const kind: T.ListingKind = rand() > 0.9 ? "consignment" : "resale";
    const broker = kind === "consignment" ? pick(brokers) : null;
    const feePct = kind === "consignment" ? s.conciergeStandardPct : s.sellerFeePct;
    const buyerFee = Math.round((price * s.buyerFeePct) / 100);
    const sellerFee = Math.round((price * feePct) / 100);
    const addons: T.OrderAddon[] = [];
    if (rand() > 0.6) {
      const ins = Math.max(s.insuranceMin, Math.round((price * s.insurancePct) / 100));
      addons.push({ serviceId: "svc_ins", type: "insurance", name: "Bảo hiểm giải chạy An Tâm", price: ins, commission: Math.round(ins * 0.3), partnerId: partners[0].id });
    }
    if (rand() > 0.75) addons.push({ serviceId: "svc_kit", type: "kit_pickup", name: "Nhận hộ race kit", price: 50000, commission: 10000, partnerId: partners[2].id });
    if (r.type === "trail" && rand() > 0.7) addons.push({ serviceId: "svc_trv", type: "travel", name: "Combo xe + homestay 2 đêm", price: 1450000, commission: 145000, partnerId: partners[1].id });
    const addonsTotal = addons.reduce((a, b) => a + b.price, 0);
    const agent = buyer.referredBy ? agents.find((a) => a.referralCode === buyer.referredBy) : undefined;
    const isRecent = now - created < 6 * day;
    const status: T.OrderStatus =
      r.status === "finished" || !isRecent
        ? rand() > 0.03 ? "completed" : "refunded"
        : pick(["completed", "transferred", "transferring", "transferring", "disputed", "pending_payment"] as const);
    const lst: T.Listing = {
      id: id("lst"), raceId: r.id, distanceId: d.id, sellerId: seller.id, kind, price, originalPrice: d.originalPrice, gender: "any",
      shirtSize: pick(["S", "M", "L"]), includesKit: false, note: "", status: status === "pending_payment" ? "reserved" : "sold",
      promotedUntil: "", agentId: "", brokerId: broker?.id ?? "", consignmentId: "", quantity: 1, views: int(20, 300), createdAt: iso(created - int(1, 10) * day),
    };
    listings.push(lst);
    const o: T.Order = {
      id: id("ord"), code: `KB${new Date(created).toISOString().slice(2, 10).replace(/-/g, "")}${(1000 + i).toString(36).toUpperCase()}`,
      listingId: lst.id, raceId: r.id, distanceId: d.id, buyerId: buyer.id, sellerId: seller.id, kind, price, buyerFee, sellerFee,
      escrowFee: s.escrowFee, addonsTotal, total: price + buyerFee + s.escrowFee + addonsTotal, sellerPayout: price - sellerFee, addons,
      runnerInfo: { fullName: buyer.name, dob: "1992-05-14", gender: "male", idNumber: `0010920${int(10000, 99999)}`, phone: buyer.phone, shirtSize: "M", emergencyContact: "Người thân – 0912345678" },
      status, paymentMethod: "vietqr", paymentRef: status === "pending_payment" ? "" : `FT${int(1e8, 9e8)}`,
      agentId: agent?.id ?? "", agentCommission: agent ? Math.round(((buyerFee + sellerFee) * s.agentSharePct) / 100) : 0,
      brokerId: broker?.id ?? "", brokerCommission: broker ? Math.round((sellerFee * s.brokerSharePct) / 100) : 0, voucherId: "",
      createdAt: iso(created), paidAt: status === "pending_payment" ? "" : iso(created + 600000),
      transferredAt: ["transferred", "completed"].includes(status) ? iso(created + int(1, 3) * day) : "",
      completedAt: status === "completed" ? iso(created + int(3, 5) * day) : "",
    };
    // Recent "transferred" orders should still be within the 72h confirmation window.
    if (status === "transferred") o.transferredAt = iso(now - int(2, 40) * 3600000);
    orders.push(o);
    if (status !== "pending_payment") {
      const approved = ["transferred", "completed"].includes(status);
      const share = Math.round((r.transferFee * s.transferSharePct) / 100);
      transfers.push({
        id: id("trf"), orderId: o.id, raceId: r.id, distanceId: d.id, fromUserId: seller.id, toUserId: buyer.id, runnerInfo: o.runnerInfo,
        status: status === "refunded" ? "rejected" : approved ? "approved" : "requested", organizerFee: r.transferFee, platformShare: approved ? share : 0,
        newBibCode: approved ? `${d.name}-${int(1000, 9999)}` : "", reason: status === "refunded" ? "Thông tin CCCD không khớp" : "",
        handledBy: approved ? r.organizerId : "", createdAt: o.paidAt, handledAt: approved ? o.transferredAt : "",
      });
      if (approved && share) ledger.push({ id: id("led"), stream: "transfer_share", amount: share, orderId: o.id, refId: "", raceId: r.id, note: "", createdAt: o.transferredAt });
    }
    if (status === "completed") {
      for (const e of orderRevenueEntries(o, o.completedAt)) ledger.push({ ...(e as T.LedgerEntry), id: id("led") });
      const paid = now - new Date(o.completedAt).getTime() > 3 * day;
      for (const [uid, type, amount] of [[o.sellerId, "seller_payout", o.sellerPayout], [o.agentId, "agent_commission", o.agentCommission], [o.brokerId, "broker_commission", o.brokerCommission]] as const)
        if (uid && amount) payouts.push({ id: id("pay"), userId: uid, orderId: o.id, type, amount, status: paid ? "paid" : "pending", createdAt: o.completedAt, paidAt: paid ? iso(new Date(o.completedAt).getTime() + day) : "" });
      if (rand() > 0.4) reviews.push({ id: id("rev"), orderId: o.id, reviewerId: buyer.id, revieweeId: seller.id, rating: pick([5, 5, 5, 4, 4, 3]), comment: pick(["Đổi tên nhanh, uy tín!", "Người bán hỗ trợ nhiệt tình.", "Giao dịch an toàn, sẽ quay lại.", "Ổn, hơi chậm phản hồi."]), createdAt: o.completedAt });
    }
    if (status === "refunded") payouts.push({ id: id("pay"), userId: buyer.id, orderId: o.id, type: "refund", amount: o.total, status: "paid", createdAt: o.createdAt, paidAt: o.createdAt });
    if (status === "disputed") disputes.push({ id: id("dsp"), orderId: o.id, openedBy: buyer.id, reason: pick(["Người bán không phản hồi", "BTC yêu cầu giấy uỷ quyền"]), detail: "Đã liên hệ nhiều lần nhưng chưa được hỗ trợ cung cấp thông tin đổi tên.", status: "open", resolution: "", createdAt: iso(now - int(1, 3) * day), resolvedAt: "" });
  }

  /* ── Services (add-ons) ── */
  const services: T.Service[] = [
    { id: "svc_ins", partnerId: partners[0].id, raceId: "", type: "insurance", name: "Bảo hiểm giải chạy An Tâm", description: "Hoàn 100% giá bib nếu chấn thương / giải huỷ; chi phí y tế đến 50 triệu.", price: 0, commissionPct: 30, active: true, createdAt: iso(now - 100 * day) },
    { id: "svc_kit", partnerId: partners[2].id, raceId: "", type: "kit_pickup", name: "Nhận hộ race kit", description: "Nhận bib, áo, chip tại Expo và giao tận khách sạn/nhà trước ngày chạy.", price: 50000, commissionPct: 20, active: true, createdAt: iso(now - 100 * day) },
  ];
  for (const r of upcoming) {
    if (r.type === "trail" && ["north", "highland"].includes(r.region))
      services.push({ id: id("svc"), partnerId: partners[1].id, raceId: r.id, type: "travel", name: `Combo xe giường nằm + homestay 2 đêm tại ${r.city}`, description: "Xe đón tối thứ 6, homestay gần vạch xuất phát, ăn sáng carb-loading.", price: pick([1290000, 1450000, 1690000]), commissionPct: 10, active: true, createdAt: iso(now - 60 * day) });
    else if (r.type === "road" && rand() > 0.6)
      services.push({ id: id("svc"), partnerId: partners[1].id, raceId: r.id, type: "hotel", name: `Khách sạn 3★ gần vạch xuất phát – ${r.city}`, description: "2 đêm, check-out muộn 14h, bữa sáng sớm từ 3h30 cho runner.", price: pick([1100000, 1400000, 1800000]), commissionPct: 12, active: true, createdAt: iso(now - 60 * day) });
  }

  /* ── Brands: ads, vouchers, data ── */
  const ads: T.AdCampaign[] = [
    { id: id("ad"), brandId: brands[0].id, name: "Trail Season 2027", placement: "home_hero", title: "Giày trail Grip Pro – bám mọi địa hình", body: "Giảm 15% cho runner có bib trail trên KBIB.", cta: "Xem bộ sưu tập", link: "https://example.com/rungear", target: "all", budget: 30000000, cpm: 60000, impressions: 182340, clicks: 3120, status: "active", startAt: iso(now - 20 * day), endAt: iso(now + 40 * day), createdAt: iso(now - 21 * day) },
    { id: id("ad"), brandId: brands[1].id, name: "Gel Fuel Race Day", placement: "race_sidebar", title: "Nạp năng lượng đúng chuẩn race day", body: "Combo 12 gel + muối điện giải, giao trước ngày chạy.", cta: "Mua combo", link: "https://example.com/nutrifuel", target: "all", budget: 15000000, cpm: 45000, impressions: 96410, clicks: 2210, status: "active", startAt: iso(now - 15 * day), endAt: iso(now + 45 * day), createdAt: iso(now - 16 * day) },
    { id: id("ad"), brandId: brands[2].id, name: "Pace Like a Pro", placement: "checkout", title: "Đồng hồ GPS đa băng tần", body: "Trả góp 0% – tặng dây thể thao khi mua kèm bib.", cta: "Khám phá", link: "https://example.com/pacewatch", target: "all", budget: 20000000, cpm: 80000, impressions: 40120, clicks: 980, status: "active", startAt: iso(now - 10 * day), endAt: iso(now + 50 * day), createdAt: iso(now - 11 * day) },
    { id: id("ad"), brandId: brands[0].id, name: "Road Racer Carbon", placement: "search_top", title: "Giày carbon cho mục tiêu Sub-3", body: "Ưu đãi riêng cho runner marathon.", cta: "Xem ngay", link: "https://example.com/rungear-road", target: "road", budget: 12000000, cpm: 50000, impressions: 30870, clicks: 640, status: "active", startAt: iso(now - 5 * day), endAt: iso(now + 25 * day), createdAt: iso(now - 6 * day) },
    { id: id("ad"), brandId: brands[1].id, name: "Ultra Fuel Kit", placement: "race_sidebar", title: "Bộ dinh dưỡng ultra 100K", body: "Thực phẩm rắn + gel caffeine cho chặng đêm.", cta: "Đặt trước", link: "https://example.com/ultra", target: "trail", budget: 8000000, cpm: 45000, impressions: 0, clicks: 0, status: "pending", startAt: iso(now), endAt: iso(now + 30 * day), createdAt: iso(now - 1 * day) },
  ];
  for (const a of ads.filter((a) => a.status === "active")) ledger.push({ id: id("led"), stream: "ads", amount: a.budget, orderId: "", refId: a.id, raceId: "", note: a.name, createdAt: a.startAt });
  const vouchers: T.Voucher[] = [
    { id: id("vch"), brandId: brands[0].id, code: "KBIBTRAIL15", title: "Giảm 15% giày trail", description: "Áp dụng toàn bộ giày trail RunGear.", discountText: "-15%", target: "trail", minKm: 0, link: "https://example.com/rungear", quantity: 500, claimed: 0, cpa: 15000, active: true, createdAt: iso(now - 30 * day) },
    { id: id("vch"), brandId: brands[1].id, code: "FUEL42", title: "Tặng 4 gel khi mua combo", description: "Cho runner cự ly 21K trở lên.", discountText: "+4 gel", target: "all", minKm: 21, link: "https://example.com/nutrifuel", quantity: 1000, claimed: 0, cpa: 8000, active: true, createdAt: iso(now - 30 * day) },
    { id: id("vch"), brandId: brands[2].id, code: "PACE500", title: "Giảm 500k đồng hồ GPS", description: "Đơn từ 5 triệu.", discountText: "-500k", target: "road", minKm: 0, link: "https://example.com/pacewatch", quantity: 300, claimed: 0, cpa: 25000, active: true, createdAt: iso(now - 30 * day) },
  ];
  const userVouchers: T.UserVoucher[] = [];
  for (const o of orders.filter((o) => o.status === "completed")) {
    const r = races.find((x) => x.id === o.raceId)!;
    const d = distances.find((x) => x.id === o.distanceId)!;
    const v = vouchers.find((v) => (v.target === "all" || v.target === r.type) && d.km >= v.minKm && v.claimed < v.quantity);
    if (!v || rand() > 0.7) continue;
    v.claimed++;
    o.voucherId = v.id;
    userVouchers.push({ id: id("uv"), userId: o.buyerId, voucherId: v.id, orderId: o.id, createdAt: o.completedAt });
    ledger.push({ id: id("led"), stream: "voucher", amount: v.cpa, orderId: o.id, refId: v.id, raceId: o.raceId, note: v.code, createdAt: o.completedAt });
  }
  const subs: T.DataSubscription[] = [
    { id: id("sub"), userId: brands[0].id, plan: "pro", price: s.dataPro, startAt: iso(now - 10 * day), endAt: iso(now + 20 * day), createdAt: iso(now - 10 * day) },
    { id: id("sub"), userId: organizers[1].id, plan: "enterprise", price: s.dataEnterprise, startAt: iso(now - 40 * day), endAt: iso(now - 10 * day), createdAt: iso(now - 40 * day) },
  ];
  for (const sub of subs) ledger.push({ id: id("led"), stream: "data_report", amount: sub.price, orderId: "", refId: sub.id, raceId: "", note: `Gói ${sub.plan}`, createdAt: sub.createdAt });

  /* ── Consignments, alerts, flags, notifications ── */
  const consignments: T.Consignment[] = [];
  for (let i = 0; i < 8; i++) {
    const r = pick(upcoming.filter((r) => r.transferPolicy !== "closed"));
    const d = pick(distOf(r));
    const tier = rand() > 0.6 ? "express" : "standard";
    const status = i < 4 ? "new" : i < 6 ? "assigned" : "listed";
    const c: T.Consignment = { id: id("csg"), userId: pick(runners).id, raceId: r.id, distanceId: d.id, desiredPrice: round10k(d.originalPrice * 0.95), tier, feePct: tier === "express" ? s.conciergeExpressPct : s.conciergeStandardPct, status, brokerId: status === "new" ? "" : brokers[0].id, listingId: "", note: "Nhờ sàn bán giúp, mình không có thời gian.", createdAt: iso(now - int(0, 5) * day) };
    if (status === "listed") {
      const l: T.Listing = { id: id("lst"), raceId: r.id, distanceId: d.id, sellerId: c.userId, kind: "consignment", price: c.desiredPrice, originalPrice: d.originalPrice, gender: "any", shirtSize: "M", includesKit: false, note: "Bán hộ bởi chuyên viên KBIB – đã xác minh bib với BTC.", status: "active", promotedUntil: tier === "express" ? iso(now + 48 * 3600000) : "", agentId: "", brokerId: brokers[0].id, consignmentId: c.id, quantity: 1, views: int(10, 100), createdAt: c.createdAt };
      listings.push(l);
      c.listingId = l.id;
    }
    consignments.push(c);
  }
  const alerts: T.WtbAlert[] = [];
  for (let i = 0; i < 120; i++) {
    const r = pick(upcoming);
    const d = pick(distOf(r));
    alerts.push({ id: id("wtb"), userId: pick(runners).id, raceId: r.id, distanceId: d.id, maxPrice: round10k(d.originalPrice * (0.9 + rand() * 0.3)), status: "active", createdAt: iso(now - int(0, 30) * day) });
  }
  const flags: T.FraudFlag[] = [
    { id: id("frd"), userId: runners[5].id, reason: "Đăng 6 bib trong 30 ngày", severity: "medium", status: "open", createdAt: iso(now - 2 * day) },
    { id: id("frd"), userId: runners[12].id, reason: "Mua 4 bib trong 30 ngày (nghi gom bib)", severity: "high", status: "open", createdAt: iso(now - 1 * day) },
  ];
  const notifications: T.Notification[] = [
    { id: id("ntf"), userId: mainRunner.id, title: "Chào mừng đến KBIB 👋", body: "Hoàn thiện hồ sơ năng lực để mua bib trail ultra.", link: "/dashboard/profile", read: false, createdAt: iso(now - 3600000) },
    { id: id("ntf"), userId: mainRunner.id, title: "Có bib bạn đang tìm!", body: "Một bib mới vừa lên sàn đúng cự ly bạn theo dõi.", link: "/races", read: false, createdAt: iso(now - 7200000) },
  ];
  const ownAlertRace = upcoming.find((r) => r.type === "trail")!;
  alerts.push({ id: id("wtb"), userId: mainRunner.id, raceId: ownAlertRace.id, distanceId: distOf(ownAlertRace)[2].id, maxPrice: distOf(ownAlertRace)[2].originalPrice, status: "active", createdAt: iso(now - 5 * day) });

  await db.users.replaceAll(users);
  await db.races.replaceAll(races);
  await db.distances.replaceAll(distances);
  await db.listings.replaceAll(listings);
  await db.orders.replaceAll(orders);
  await db.transfers.replaceAll(transfers);
  await db.payouts.replaceAll(payouts);
  await db.reviews.replaceAll(reviews);
  await db.disputes.replaceAll(disputes);
  await db.services.replaceAll(services);
  await db.ad_campaigns.replaceAll(ads);
  await db.vouchers.replaceAll(vouchers);
  await db.user_vouchers.replaceAll(userVouchers);
  await db.data_subscriptions.replaceAll(subs);
  await db.consignments.replaceAll(consignments);
  await db.wtb_alerts.replaceAll(alerts);
  await db.fraud_flags.replaceAll(flags);
  await db.notifications.replaceAll(notifications);
  await db.promotions.replaceAll(promotions);
  await db.ledger.replaceAll(ledger);
  await db.settings.replaceAll([]);
  void admin;
  return { users: users.length, races: races.length, listings: listings.length, orders: orders.length, ledger: ledger.length };
}

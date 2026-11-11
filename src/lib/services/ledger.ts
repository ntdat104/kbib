import { db, newId } from "@/lib/db";
import type { LedgerEntry, Order, RevenueStream } from "@/lib/types";
import { nowIso } from "@/lib/utils";

export const STREAM_LABEL: Record<RevenueStream, string> = {
  buyer_fee: "Phí người mua",
  seller_fee: "Phí người bán",
  escrow_fee: "Phí escrow & xác thực",
  transfer_share: "Chia sẻ phí đổi tên BTC",
  promotion: "Đẩy tin (Promoted)",
  ads: "Quảng cáo thương hiệu",
  concierge: "Dịch vụ bán hộ",
  addon_commission: "Hoa hồng xe/KS/nhận kit",
  insurance: "Hoa hồng bảo hiểm",
  official_commission: "Phân phối bib chính thức",
  voucher: "Voucher thương hiệu (CPA)",
  data_report: "Báo cáo dữ liệu",
  agent_commission: "Hoa hồng đại lý (chi)",
  broker_commission: "Hoa hồng trung gian (chi)",
};

/** Pure: platform revenue lines recognised when an order completes. */
export function orderRevenueEntries(o: Order, at = nowIso()): Partial<LedgerEntry>[] {
  const sellerStream: RevenueStream =
    o.kind === "official" ? "official_commission" : o.kind === "consignment" ? "concierge" : "seller_fee";
  const lines: Partial<LedgerEntry>[] = [
    { stream: "buyer_fee", amount: o.buyerFee },
    { stream: sellerStream, amount: o.sellerFee },
    { stream: "escrow_fee", amount: o.escrowFee },
    ...(o.addons ?? []).map((a) => ({
      stream: (a.type === "insurance" ? "insurance" : "addon_commission") as RevenueStream,
      amount: a.commission,
      refId: a.serviceId,
      note: a.name,
    })),
    { stream: "agent_commission", amount: -o.agentCommission, refId: o.agentId },
    { stream: "broker_commission", amount: -o.brokerCommission, refId: o.brokerId },
  ];
  return lines
    .filter((l) => l.amount)
    .map((l) => ({ id: newId("led"), orderId: o.id, raceId: o.raceId, createdAt: at, refId: "", note: "", ...l }));
}

export async function record(entry: Omit<Partial<LedgerEntry>, "id"> & { stream: RevenueStream; amount: number }) {
  return db.ledger.insert({ id: newId("led"), createdAt: nowIso(), ...entry });
}

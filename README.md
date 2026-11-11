# KBIB – Sàn giao dịch Bib Road & Trail

Next.js 16 (App Router, Server Actions) + Google Sheets backend. Thiết kế chi tiết: [`../docs/DESIGN.md`](../docs/DESIGN.md).

## Chạy nhanh (chế độ demo, không cần Google)

```bash
npm install
npm run dev            # http://localhost:3000
```
Lần chạy đầu tự sinh dữ liệu demo vào `.data/db.json`: 100 giải, ~85 tài khoản, ~200 đơn, sổ doanh thu.
Mật khẩu mọi tài khoản demo: `kbib@123`

| Vai trò | Email |
|---|---|
| Runner | runner@kbib.vn |
| Đại lý | daily@kbib.vn |
| Trung gian pass bib | trunggian@kbib.vn |
| Ban tổ chức | btc@kbib.vn, btc.trail@kbib.vn |
| Thương hiệu | brand@kbib.vn |
| Đối tác dịch vụ | doitac@kbib.vn |
| Quản trị | admin@kbib.vn |

Xoá `.data/` để sinh lại dữ liệu.

## Kết nối Google Sheets

> Hướng dẫn chi tiết lấy từng biến môi trường (Google, thanh toán, cron, Discord, deploy): [`../docs/env/README.md`](../docs/env/README.md)

1. Google Cloud Console → bật **Google Sheets API** → tạo **Service Account** → tạo key JSON.
2. Tạo một Google Sheet trống, **Share** cho email service account với quyền *Editor*.
3. `cp .env.example .env.local` và điền:
   ```
   GOOGLE_SHEET_ID=<id trong URL của sheet>
   GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email>
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   SESSION_SECRET=<chuỗi ngẫu nhiên ≥ 32 ký tự>
   ```
4. Tạo 21 tab + header (và tuỳ chọn nạp dữ liệu demo):
   ```bash
   npm run sheets:setup            # chỉ tạo tab/header
   npm run sheets:setup -- --seed  # GHI ĐÈ toàn bộ dữ liệu bằng dữ liệu demo
   ```
5. `npm run dev`. Trang `/admin` hiển thị driver đang dùng.

**Lưu ý vận hành Sheets:** không xoá/sắp xếp dòng trực tiếp trên sheet (driver dùng số dòng ổn định); có thể thêm cột. Bảng lớn có thể tách sang file riêng với `GOOGLE_SHEET_ID_ORDERS`, `GOOGLE_SHEET_ID_LEDGER`, `GOOGLE_SHEET_ID_USERS`…

## Tích hợp

- **Webhook thanh toán**: `POST /api/payments/webhook`, header `x-signature` = HMAC-SHA256(body, `PAYMENT_WEBHOOK_SECRET`), body `{ transactions: [{ id, amount, description }] }` – mã đơn `KB…` trong nội dung chuyển khoản.
- **API BTC**: `GET/POST /api/v1/organizer/transfers` với `Authorization: Bearer <apiKey>` (xem `/organizer/api`).
- **Cron escrow**: `GET /api/cron/escrow` mỗi 5–15 phút (header `Authorization: Bearer $CRON_SECRET`) – huỷ đơn quá hạn thanh toán, tự giải ngân sau 72h, ghi bộ đếm lượt xem/hiển thị.
- Production: đặt `PAYMENT_SANDBOX=false` để ẩn nút thanh toán thử.

## Cấu trúc

```
src/lib/db/        schema.ts (nguồn sự thật cột) · sheets-driver · local-driver · index (cache, mutex) · seed
src/lib/services/  pricing · orders (escrow) · marketplace · catalog · insights · ledger · ads · fraud · counters
src/lib/actions/   server actions (auth, market, portal)
src/app/(site)     trang công khai, checkout, đơn hàng
src/app/(portal)   dashboard runner + cổng agent/broker/organizer/brand/partner/admin
```

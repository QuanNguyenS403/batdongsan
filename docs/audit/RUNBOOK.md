# RUNBOOK.md — Sổ Tay Vận Hành, Triển Khai & Ứng Phó Sự Cố

- **Dự án**: Nền tảng Cho thuê QNS
- **Căn cứ**: Mục 12.1 trong `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)
- **Mục tiêu**: Cung cấp quy trình vận hành chi tiết, các kịch bản diễn tập sao lưu khôi phục và xử lý sự cố.

---

## 1. Quy Trình Triển Khai Chuẩn (Standard Deployment Workflow)

### Bước 1: Cài đặt phụ thuộc bất biến (Frozen Install)
```bash
pnpm install --frozen-lockfile
```

### Bước 2: Biên dịch theo Build Graph tuần tự
```bash
# Prisma generate -> NestJS API dist -> Next.js static & SSR bundle
pnpm build
```

### Bước 3: Triển khai DDL Migration lên cơ sở dữ liệu
```bash
# Chạy migration không tương tác trên môi trường production
pnpm db:migrate:deploy
```

### Bước 4: Kiểm thử khói (Smoke Test)
```bash
# Kiểm tra liveness và readiness của API
curl -f http://localhost:4000/health || exit 1
```

---

## 2. Diễn Tập Sao Lưu & Khôi Phục Dữ Liệu (Backup & Restore Drill - §11 Mục 8)

- **Mục tiêu SLA**: RPO $\le 24\text{h}$, RTO $\le 4\text{h}$ (giai đoạn pilot đạt RTO $\approx 13\text{s}$).

### Kịch bản diễn tập thực tế (`backup-restore-drill.js`):
1. **Sao lưu CSDL (Dump)**:
   ```bash
   pg_dump -U postgres -d batdongsan -F p -f docs/ops/backup-drill-snapshot.sql
   ```
2. **Tính Checksum thư mục ảnh uploads**:
   - Quét toàn bộ file trong `apps/api/uploads`.
   - Tính mã băm SHA-256 cho từng file và ghi vào manifest `BACKUP-RESTORE-DRILL-REPORT.json`.
3. **Phục hồi vào CSDL thử nghiệm tách biệt**:
   ```bash
   createdb -U postgres batdongsan_restore_test
   psql -U postgres -d batdongsan_restore_test -f docs/ops/backup-drill-snapshot.sql
   ```
4. **Đối soát tính toàn vẹn**:
   - Đếm số dòng bảng `listings`, `users`, `finance_ledgers`.
   - Đối chiếu tổng số dư `FinanceLedger.amount` trước và sau phục hồi.
   - So sánh 100% SHA-256 các file ảnh uploads.

---

## 3. Quy Trình Ứng Phó Sự Cố Tích Hợp (Incident Response)

### A. Nhà cung cấp SMS OTP bị sự cố (Provider Down)
- **Dấu hiệu**: Người dùng không nhận được mã OTP; log trả về mã lỗi HTTP 500/502 hoặc timeout 5s.
- **Biện pháp xử lý**:
  1. Kiểm tra số dư tài khoản tại cổng SMS đối tác (eSMS, Twilio, SpeedSMS).
  2. Đổi biến môi trường `SMS_PROVIDER` sang nhà cung cấp phụ trong danh sách đã hỗ trợ trong `assert-env.ts`.
  3. Khởi động lại dịch vụ API để áp dụng cấu hình mới.

### B. Transactional Outbox bị treo sự kiện (Stuck Processing / DLQ)
- **Dấu hiệu**: Email xác nhận duyệt gói không gửi được; sự kiện outbox tồn đọng ở trạng thái `PROCESSING` hoặc `FAILED`.
- **Cơ chế tự phục hồi tự động (RB-07)**:
  - Worker tự động quét và thu hồi (reclaim) các sự kiện bị kẹt ở trạng thái `PROCESSING` quá 5 phút đưa về `PENDING`.
  - Thực hiện retry với cơ chế exponential backoff (tối đa 5 lần).
- **Xử lý thủ công**:
  - Truy cập API `/admin/tasks/status` để kiểm tra số lượng sự kiện lỗi.
  - Sử dụng API retry DLQ để kích hoạt gửi lại sau khi đối tác mail/Sheets phục hồi.

### C. Đối Soát & Chênh Lệch Tài Chính (Financial Reconciliation)
- **Định kỳ hàng ngày**:
  1. Chạy script đối soát số dư: `pnpm ts-node packages/database/scripts/backfill-finance-ledgers.ts`.
  2. So sánh tổng tiền thực thu trên bảng điều khiển `GET /admin/finance/summary` với báo nợ/báo có của tài khoản ngân hàng Vietcombank.
  3. Nếu có giao dịch lệch mã tham chiếu: Đối soát thủ công qua bảng `AuditEvent` để xác định admin thực hiện thao tác duyệt.

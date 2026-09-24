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

---

## 4. Quy Trình Vận Hành Môi Giới Cho Thuê (Pivot 24/09/2026 - Quan Phụ Trách)

### A. Chu trình đầu ngày
1. Kiểm tra hàng đợi Lead mới (`/admin/leads`), tự gán Quan phụ trách; cảnh báo lead quá SLA 2h.
2. Kiểm tra lịch xem phòng trong ngày (tối đa 3 lịch/ngày), xác nhận người mở cửa phía chủ và khách thuê.
3. Rà soát danh sách công nợ phí môi giới (`Commission` ở trạng thái `DUE` hoặc `OVERDUE`).
4. Đối soát số dư biến động ngân hàng với các khoản thanh toán phí `SUBMITTED`.

### B. Quy trình trước và sau buổi dẫn xem
1. **Trước buổi xem**: Gửi xác nhận cho khách (tên người dẫn là Quan, SĐT liên hệ, vị trí điểm hẹn, mã phòng, giá niêm yết, cam kết miễn phí dẫn xem 100%).
2. **Tại phòng**: Trực tiếp hướng dẫn khách khảo sát hiện trạng, đối chiếu biểu phí điện nước, tiện ích thực tế; tuyệt đối không cam kết thay chủ ngoài thẩm quyền.
3. **Sau buổi xem**: Ghi nhận kết quả xem (`Viewing.status = COMPLETED / NO_SHOW / RESCHEDULED`), ghi nhận phản hồi của khách vào hệ thống.

### C. Quy trình ký kết, bàn giao và ghi nhận phí 40%
1. **Ký thuê**: Chủ và khách ký hợp đồng thuê trực tiếp (HĐ-02). Quan chứng kiến và lưu bản sao có mã giao dịch `RentalDeal`.
2. **Bàn giao phòng**: Lập biên bản bàn giao (BB-03) ghi nhận ngày bàn giao, chìa khóa, chỉ số điện nước.
3. **Điều kiện ghi nhận thành công (§6.2)**: Khi hội tụ đủ 5 điều kiện (HĐ dịch vụ hiệu lực + HĐ thuê đã ký + tiền thuê kỳ đầu đã thanh toán + phòng đã bàn giao + không còn tranh chấp), hệ thống mới chuyển `RentalDeal.status = ACTIVE`, ghi nhận `Commission.status = DUE` với cơ sở 40% tiền thuê thuần tháng đầu sau ưu đãi.
4. **Đối soát thu phí**: Chủ thanh toán qua ngân hàng trong vòng 2 ngày làm việc. Chỉ khi đối soát khớp biến động tài khoản thật kèm mã tham chiếu giao dịch thì mới chuyển `Commission.status = PAID` và ghi sổ cái `FinanceLedger` (BR-11, AT-20, AT-21).

# CẨM NANG VẬN HÀNH PILOT CÓ KIỂM SOÁT (PILOT RUNBOOK & SOP - WAVE 6)

> **Mục tiêu**: Hướng dẫn vận hành hệ thống BĐS Cho Thuê trong giai đoạn thử nghiệm có kiểm soát (Controlled Pilot 7 ngày) sau khi đã hoàn thành 100% các Wave từ Wave 0 đến Wave 5.

---

## 1. Phạm vi Pilot (Scope & Boundary)

1. **Địa bàn thử nghiệm cốt lõi**:
   - Quận Cầu Giấy, Quận Đống Đa (Hà Nội) — tập trung quanh các trường đại học lớn: ĐHQG Hà Nội, ĐH Ngoại Thương, ĐH Giao thông Vận tải, Học viện Báo chí & Tuyên truyền.
2. **Loại hình phòng kiểm chứng**:
   - Phòng trọ sinh viên (`phong_tro_sinh_vien`)
   - Căn hộ mini / Studio (`studio`, `can_ho_mini`)
3. **Chính sách nguồn cung**:
   - 100% tin đăng hiển thị trên sàn phải có xác thực thực tế (`da_xac_thuc`) hoặc xác thực số điện thoại chủ nhà chính xác.
   - Không mở diện rộng toàn quốc trong 7 ngày đầu tiên để kiểm soát chất lượng lead và trải nghiệm khách thuê.

---

## 2. Quy trình Vận hành Đầu ngày (Morning Checklist SOP)

Mỗi ngày vào lúc **08:00 sáng**, đội ngũ vận hành thực hiện tuần tự 5 bước:

1. **Chạy Synthetic Monitor**:
   ```bash
   node packages/database/scripts/synthetic-monitor.js
   ```
   - Xác nhận: API Health HTTP 200, thời gian phản hồi tìm kiếm < 500ms.
2. **Kiểm tra Dead Letter Queue (DLQ)**:
   - Truy cập endpoint Admin: `GET /admin/outbox/dlq`
   - Nếu có event lỗi (status: `FAILED`): Rà soát lý do lỗi (SMTP down, Sheets rate limit) và bấm `POST /admin/outbox/dlq/:id/retry`.
3. **Kiểm tra Hàng đợi Lead Khách thuê**:
   - Truy cập: `/admin/leads`
   - Xác nhận: Toàn bộ lead mới nhận đều có thông tin SĐT hợp lệ, đã gán cho môi giới/chủ phòng và chưa bị tồn đọng > 2 giờ.
4. **Đối soát Sổ cái Tài chính (Finance Ledger)**:
   - Truy cập: `/admin/duyet-goi` và widget Doanh thu trên `/admin`
   - Đối chiếu: Doanh thu thực thu (`confirmedCashIn`) trên Dashboard khớp 100% với biến động số dư ngân hàng thật qua `externalTransactionId`.
   - Tuyệt đối không bấm duyệt nếu chưa có tiền nổi vào tài khoản.
5. **Kiểm tra Tin Quá hạn (Tasks Sweep)**:
   - Xác nhận: `TasksService` tự động chuyển các tin hết hạn sang `expired`, tin không còn xuất hiện trên danh mục public.

---

## 3. Cổng Quyết định (Go / Hold / Rollback Gate)

| Quyết định | Điều kiện kích hoạt | Hành động xử lý |
|---|---|---|
| **GO (Mở rộng quy mô)** | Sau 7 ngày liên tục: Tỉ lệ lỗi 5xx < 0.1%, không có lead spam vượt lọc, 100% giao dịch tài chính khớp lệnh qua Sổ cái, không có khiếu nại lừa đảo tiền cọc. | Mở thêm Quận Thanh Xuân, Hai Bà Trưng, TP.HCM; kích hoạt thêm gói thành viên nâng cao. |
| **HOLD (Tạm dừng giữ nguyên)** | Phát hiện sai lệch số liệu tài chính < 5%, hoặc tỉ lệ lead không phản hồi > 30%, hoặc SMTP/Sheets bị gián đoạn tạm thời. | Đóng nhận đăng ký gói mới, xử lý sạch hàng đợi outbox và lead tồn đọng trước khi tiếp tục. |
| **ROLLBACK (Khôi phục khẩn cấp)** | Phát hiện lỗ hổng phân quyền, rò rỉ dữ liệu SĐT trái phép, hoặc lỗi ghi nhận tiền ảo vào tài khoản thành viên. | Kích hoạt script `backup-restore-drill.js`, ngắt luồng duyệt gói, đưa hệ thống về chế độ an toàn (Safe Mode). |

---

## 4. Nhật ký Theo dõi Sự cố (Incident Tracking Log)

| Thời gian | Mã Incident | Mức độ (P0/P1/P2) | Mô tả sự cố | Nguyên nhân gốc rễ | Biện pháp khắc phục | Trạng thái |
|---|---|---|---|---|---|---|
| 12/09/2026 | INC-INIT | P0 | Audit độc lập phát hiện các lỗ hổng phân quyền và dòng tiền | Backdoor credential và ghi nhận doanh thu sớm | Đã khắc phục 100% qua Wave 0 - Wave 5 | **Resolved** |
| (Trống) | — | — | Chờ ghi nhận trong 7 ngày Pilot | — | — | Ready |

---

*Tài liệu ban hành phục vụ Giai đoạn 6 (Controlled Pilot Readiness) theo đặc tả `docs/audit/BATDONGSAN-AUDIT-EXECUTION-PLAN.md`.*

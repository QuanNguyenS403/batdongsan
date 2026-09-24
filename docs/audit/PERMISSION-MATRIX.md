# PERMISSION-MATRIX.md — Ma Trận Phân Quyền & Kiểm Soát Truy Cập

- **Dự án**: Nền tảng Cho thuê QNS
- **Căn cứ**: Mục 9.2 và Mục 12.1 trong `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)
- **Mục tiêu**: Tách biệt đặc quyền theo Capability, loại bỏ tình trạng gộp toàn bộ quyền vào một role `admin` duy nhất (F12).

---

## 1. Định Nghĩa Các Vai Trò & Capabilities

1. **GUEST**: Người dùng vãng lai chưa xác thực danh tính.
2. **USER**: Khách tìm thuê đã đăng ký tài khoản (xác thực OTP SĐT).
3. **SELLER**: Chủ phòng / Người cho thuê có đăng tin.
4. **BROKER**: Người đại diện / Môi giới có ủy quyền (có gắn nhãn rõ ràng).
5. **MODERATOR** (Capability `LISTINGS_MODERATE`): Nhân viên kiểm duyệt tin đăng, đối soát bằng chứng quyền cho thuê, xử lý báo cáo vi phạm.
6. **SUPPORT** (Capability `LEADS_SUPPORT`): Nhân viên hỗ trợ người dùng, giải quyết tranh chấp liên hệ.
7. **FINANCE** (Capability `FINANCE_MANAGE`): Nhân viên kế toán/tài chính, duyệt thanh toán chuyển khoản, xử lý hoàn tiền, đối soát sổ cái.
8. **ADMIN** (Capability `SYSTEM_ADMIN`): Quản trị viên tối cao, quản lý cấu hình hệ thống, tài khoản nhân viên, nhật ký kiểm toán.

---

## 2. Ma Trận Vai Trò × Hành Động × Dữ Liệu Được Phép Xem

| Hành động / Endpoint | GUEST | USER | SELLER / BROKER | MODERATOR | FINANCE | SYSTEM ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Xem danh sách tin công khai (`GET /listings`)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Xem chi tiết tin (`GET /listings/:slug`)** | ✅ (ẩn SĐT) | ✅ (ẩn SĐT) | ✅ (ẩn SĐT) | ✅ (đầy đủ) | ✅ (đầy đủ) | ✅ (đầy đủ) |
| **Xem số điện thoại người đăng (`POST /reveal-phone`)** | ❌ (401) | ✅ (rate-limit) | ✅ (rate-limit) | ✅ | ✅ | ✅ |
| **Lưu tin / Tìm kiếm đã lưu** | ❌ (401) | ✅ (chính mình) | ✅ (chính mình) | ❌ | ❌ | ❌ |
| **Gửi liên hệ thuê (`POST /leads`)** | ✅ (có OTP/SĐT) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Xem hộp thư khách quan tâm (`GET /leads/mine`)** | ❌ (401) | ❌ (403) | ✅ (chỉ tin của mình)| ❌ | ❌ | ✅ |
| **Tạo tin đăng mới (`POST /listings`)** | ❌ (401) | ✅ (tối đa 3 tin) | ✅ (theo quota gói) | ❌ | ❌ | ✅ (test) |
| **Sửa / Thêm ảnh tin của mình** | ❌ (401) | ✅ (chính mình) | ✅ (chính mình) | ❌ | ❌ | ❌ |
| **Sửa tin của người khác (IDOR)** | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ (chỉ override khẩn cấp) |
| **Duyệt / Từ chối tin (`/admin/listings/:id/approve`)** | ❌ (401) | ❌ (403) | ❌ (403) | ✅ | ❌ (403) | ✅ |
| **Cấp / Thu hồi huy hiệu xác thực thực tế** | ❌ (401) | ❌ (403) | ❌ (403) | ✅ | ❌ (403) | ✅ |
| **Xem bằng chứng giấy tờ quyền cho thuê** | ❌ | ❌ | ✅ (chỉ giấy của mình)| ✅ | ❌ | ✅ |
| **Yêu cầu mua gói thành viên (`POST /memberships/request`)**| ❌ (401) | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Duyệt thanh toán gói (`/admin/membership-requests/:id/approve`)** | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ | ✅ |
| **Xử lý hoàn tiền (`/admin/membership-requests/:id/refund`)** | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ | ✅ |
| **Xem sổ cái tài chính (`GET /admin/finance/summary`)** | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ | ✅ |
| **Xem nhật ký kiểm toán (`GET /admin/audit-events`)** | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| **Khóa / Mở khóa tài khoản (`POST /admin/users/:id/toggle-block`)** | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| **Thực thi quét dọn quá hạn (`POST /admin/tasks/run-sweep`)** | ❌ (401) | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |

---

## 3. Quy Tắc Bảo Vệ Dữ Liệu & Che Mờ Thông Tin (PII Masking)

1. **Số điện thoại**:
   - Ở API công khai (`/listings`, `/listings/:slug`): Che mờ 4 số cuối (VD: `0912***678`).
   - Chỉ trả số đầy đủ qua endpoint có xác thực `POST /listings/:id/reveal-phone` kèm ghi vết nhật ký.
2. **Chứng từ thanh toán & Sao kê**:
   - Chỉ nhân sự có capability `FINANCE_MANAGE` hoặc `SYSTEM_ADMIN` mới được xem mã tham chiếu ngân hàng đầy đủ và hình ảnh ủy nhiệm chi.
3. **Giấy tờ định danh & Giấy tờ nhà đất**:
   - Lưu trữ tại vùng lưu trữ riêng biệt (không dùng đường dẫn public CDN).
   - Tuyệt đối không phục vụ công khai qua web; chỉ nhân viên kiểm duyệt có thẩm quyền được xem trong phiên làm việc có ghi log.

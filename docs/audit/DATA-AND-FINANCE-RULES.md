# DATA-AND-FINANCE-RULES.md — Quy Tắc Dữ Liệu, Tiền Tệ & Sổ Cái Tài Chính

- **Dự án**: Nền tảng Cho thuê QNS
- **Căn cứ**: Mục 4, 8, 9.3 trong `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)
- **Ngày cập nhật**: 21/09/2026

---

## 1. Quy Định Tiền Tệ & Số Học (Currency & Numeric Boundaries)

1. **Đơn vị tiền tệ chuẩn**:
   - Mọi giá trị tiền (giá thuê, tiền cọc, tiền gói dịch vụ, tiền hoàn, số dư sổ cái) **BẮT BUỘC lưu trữ ở đơn vị Việt Nam Đồng (VNĐ) nguyên dạng số nguyên `BigInt` (BIGINT trong CSDL)**.
   - Tuyệt đối **không lưu số thập phân** trong cơ sở dữ liệu để tránh sai số dấu phẩy động (floating-point inaccuracies).
2. **Chuyển đổi & Tuần tự hóa an toàn (Serialization Boundary)**:
   - Khi trả dữ liệu ra JSON qua HTTP API: Sử dụng `BigIntInterceptor` toàn cục để serialize đệ quy toàn bộ giá trị `BigInt` sang định dạng chuỗi (`string`) hoặc số nguyên nằm trong giới hạn an toàn `Number.isSafeInteger(n)`.
   - Ngăn ngừa lỗi `TypeError: Do not know how to serialize a BigInt` gây sập API (lỗi 500).
3. **Hiển thị giao diện người dùng**:
   - Chỉ format hiển thị ở tầng UI: Sử dụng `formatExactPrice` (VD: `1.498.500 đ`) ở các khu vực liên quan tới thanh toán, chuyển khoản, sổ cái và chi tiết tin.
   - Đối với danh sách tóm tắt: Sử dụng `formatPrice` giữ tối đa 2 chữ số thập phân (VD: `3,5 triệu/tháng`), không làm tròn cụt mất số lẻ.

---

## 2. Chu Trình Trạng Thái Gói Dịch Vụ & Nguyên Tắc Snapshot

### A. Vòng đời UserMembership:
```
[User gửi yêu cầu] 
       ↓ (Tạo UserMembership: status='pending', quotedAmount=X, confirmedPaymentAmount=0)
[Admin kiểm tra sao kê]
       ├── [Hợp lệ] ──→ status='active', confirmedPaymentAmount=X, startDate=now, endDate=calc, ghi Ledger (INFLOW)
       ├── [Từ chối] ─→ status='rejected', rejectionReason='...', ghi AuditEvent
       └── [Quá 7 ngày] → status='rejected' (TasksService sweep tự động dọn)
[Khi đang active]
       ├── [Hết thời hạn] ─→ status='expired' (TasksService sweep định kỳ)
       └── [Yêu cầu hoàn] ─→ status='refunded', ghi Ledger (OUTFLOW đảo bút toán), hoàn trả tiền
```

### B. Nguyên Tắc Bất Biến Snapshot (`planSnapshot` - F04):
- Ngay khi người dùng nhấn yêu cầu mua gói, toàn bộ thông số định giá và quyền lợi tại thời điểm đó được serialize thành JSON và lưu vào `UserMembership.planSnapshot`:
  ```json
  {
    "planId": 2,
    "planCode": "PRO_10",
    "planName": "Gói Quản lý nhỏ",
    "maxActiveListings": 10,
    "durationDays": 30,
    "basePrice": "149000",
    "priceMultiplier": 1.0,
    "quotedAmount": "149000",
    "snapshotAt": "2026-09-21T00:00:00.000Z"
  }
  ```
- Mọi hàm kiểm tra quota (`ListingsService.create`, `AdminService.approveListing`) và hàm hiển thị (`MembershipService.getMyMembership`) **bắt buộc đọc từ `planSnapshot`**.
- Thay đổi giá hoặc thời hạn trong bảng `MembershipPlan` tuyệt đối không ảnh hưởng hồi tố tới các gói người dùng đang sở hữu.

---

## 3. Sổ Cái Tài Chính Bất Biến (FinanceLedger)

1. **Nguyên tắc Append-Only (Chỉ ghi thêm)**:
   - Bảng `FinanceLedger` là bản ghi kế toán bất biến. Cấm mọi câu lệnh `UPDATE` hoặc `DELETE` trên bảng này qua tầng API nghiệp vụ.
   - Khi có sự kiện hoàn tiền hoặc điều chỉnh số liệu: Ghi thêm một dòng bút toán đảo (entryType = `REFUND` hoặc `ADJUSTMENT`) với số tiền âm hoặc dương tương ứng.
2. **Bảo toàn dữ liệu (`onDelete: Restrict`)**:
   - Khóa ngoại giữa `User` và `FinanceLedger` được thiết lập `onDelete: Restrict`.
   - Ngăn chặn triệt để nguy cơ xóa nhầm tài khoản người dùng làm mất dấu vết giao dịch tài chính.
3. **Mã tham chiếu ngân hàng duy nhất (`externalTransactionId`)**:
   - Khi duyệt thu tiền hoặc ghi nhận hoàn tiền, bắt buộc phải có mã tham chiếu ngân hàng thật (`externalTransactionId`).
   - Cấm tự động sinh mã giả `BANK_MANUAL_...` (F02).
   - Kiểm tra unique constraint hoặc chống duyệt trùng 1 mã giao dịch ngân hàng cho 2 đơn hàng khác nhau.

---

## 4. Xử Lý Cạnh Tranh & Tính Toàn Vẹn (Concurrency & Idempotency)

1. **Khóa Lạc Quan / Compare-And-Set (CAS)**:
   - Duyệt tin đăng: Câu lệnh `updateMany` chứa điều kiện `where: { id, status: 'pending' }`. Nếu số bản ghi cập nhật = 0 $\rightarrow$ ném HTTP 409 Conflict (đã bị admin khác xử lý).
   - Duyệt gói thành viên: Câu lệnh update có `where: { id, status: 'pending' }`.
2. **Chống vượt Quota khi tạo tin đăng đồng thời (F05)**:
   - Thực thi đếm số tin active hiện tại và ghi bản ghi mới bên trong cùng một giao dịch nguyên tử Prisma `$transaction` với mức cô lập phù hợp hoặc khóa cấp người dùng.
3. **Deduplication Key cho Lead**:
   - Gửi lead liên hệ có trường `dedupeKey = sha256(listingId + phone + YYYY-MM-DD)` chặn spam click nhiều lần trong cùng một ngày.

---

## 5. Quy Trình Di Chuyển Dữ Liệu Chuẩn (Migration Lifecycle - §9.3)

Mọi thay đổi cấu trúc cơ sở dữ liệu trên production bắt buộc tuân theo chu trình 5 bước:
1. **Expand (Mở rộng)**: Thêm cột/bảng mới, cho phép nullable hoặc có giá trị mặc định. Code cũ vẫn chạy bình thường.
2. **Backfill (Nạp bù dữ liệu)**: Chạy script nền an toàn để nạp dữ liệu cho các bản ghi cũ (VD: script `backfill-finance-ledgers.ts`).
3. **Reconcile (Đối soát)**: Kiểm tra checksum, tổng số dòng và tổng tiền trước và sau khi backfill.
4. **Switch Code (Chuyển đổi mã nguồn)**: Triển khai phiên bản code mới bắt đầu đọc và ghi vào cấu trúc mới.
5. **Contract (Thu hẹp)**: Sau khi hệ thống chạy ổn định và an toàn, tạo migration xóa bỏ cột/bảng cũ không còn sử dụng.

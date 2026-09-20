# BRAND-AND-TRUST.md — Định Vị Thương Hiệu, Thông Điệp & Cơ Chế Tin Cậy

- **Dự án**: QNS Thuê (nền tảng chuyên cho thuê)
- **Căn cứ**: Mục 3 và Mục 7 trong `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)
- **Ngày cập nhật**: 21/09/2026

---

## 1. Định Vị Thương Hiệu & Bộ Nhận Diện (§3.1)

### Tên thương hiệu làm việc: **QNS Thuê**
- Tên gọi ngắn gọn, dễ nhớ, gắn liền trực tiếp với hành vi tìm chỗ thuê.
- Loại bỏ các dấu nháy khó gõ và các hậu tố không cần thiết (`QNS'bds.vn`, `BĐS.vn`).
- Chấm dứt việc dùng tên "Thue Tro Nhanh" trong tin nhắn SMS OTP để tránh giới hạn thương hiệu vào phòng trọ giá rẻ.

### Slogan chính thức:
> **"Rõ chi phí. Đúng người cho thuê."**

### Ma trận thông điệp truyền thông chuẩn hóa:

| Thành phần | Nội dung chuẩn hóa | Yêu cầu kiểm chứng kỹ thuật & vận hành |
|---|---|---|
| **Slogan** | Rõ chi phí. Đúng người cho thuê. | Có đầy đủ các trường đơn giá điện, nước, cọc, kỳ hạn; người đăng được xác minh vai trò. |
| **H1 Trang chủ** | Tìm chỗ thuê phù hợp, rõ chi phí ngay từ đầu | Không tự ý gán giá hoặc chi phí giả khi chủ phòng chưa khai báo. |
| **Mô tả Hero** | Từ phòng trọ, studio đến căn hộ và nhà nguyên căn. Xem thông tin, so sánh chi phí và liên hệ trực tiếp bên cho thuê. | Không chèn số điện thoại của sàn; chuyển tiếp liên hệ trung thực tới chủ phòng. |
| **Cam kết phí** | Nền tảng không thu phí tìm kiếm và liên hệ từ người thuê | Miễn phí 100% người thuê; nếu chủ phòng có thu phí riêng phải công khai trong tin. |
| **CTA Người thuê** | Tìm chỗ thuê | Bộ lọc và trạng thái tìm kiếm được bảo toàn qua URL khi điều hướng. |
| **CTA Người cho thuê** | Đăng chỗ cho thuê | Minh bạch bảng giá, quyền lợi, giới hạn tin đăng trước khi giao dịch. |

---

## 2. Từ Cấm & Giới Hạn Tuyên Bố Tuyệt Đối (Zero Tolerance Policy)

Hệ thống tuân thủ nguyên tắc không tuyên bố những điều vượt quá khả năng kiểm soát kỹ thuật.
**Nghiêm cấm xuất hiện các cụm từ sau trong toàn bộ giao diện, mã nguồn, metadata, email và tài liệu**:
1. ❌ `"100% chính chủ"` $\rightarrow$ Thay bằng: *"Chủ phòng"* hoặc *"Người đại diện có ủy quyền"*.
2. ❌ `"Không lừa đảo"` $\rightarrow$ Thay bằng: *"Đã kiểm tra thực tế"* hoặc *"Có báo cáo vi phạm"*.
3. ❌ `"An toàn tuyệt đối"` $\rightarrow$ Thay bằng: *"Kiểm soát tin đăng"* hoặc *"Quy trình xác minh 3 lớp"*.
4. ❌ `"Chắc chắn có khách"` $\rightarrow$ Thay bằng: *"Tiếp cận khách thuê tiềm năng"*.

---

## 3. Bảng Thông Tin Thuê Minh Bạch (§3.2)

Mỗi trang chi tiết tin đăng (`/tin/[slug]`) bắt buộc hiển thị một **Bảng thông tin thuê minh bạch** chuẩn hóa:

1. **Chi phí cố định hàng tháng**:
   - Giá thuê niêm yết (VNĐ/tháng).
   - Tiền đặt cọc cam kết (số tháng hoặc số tiền cụ thể).
   - Kỳ hạn thanh toán (hàng tháng, 3 tháng, 6 tháng) & Thời hạn hợp đồng tối thiểu.
2. **Chi phí biến đổi & Dịch vụ**:
   - Đơn giá điện: đ/kWh (ghi rõ giá nhà nước hay giá chủ trọ quy định).
   - Đơn giá nước: đ/m³ (theo đồng hồ) hoặc đ/người/tháng (khoán).
   - Phí dịch vụ khác: Internet/Wifi, gửi xe (xe máy/ô tô), phí quản lý, phí vệ sinh, thang máy.
   - Ghi chú rõ các khoản đã bao gồm (`utilitiesIncluded`) hay tính riêng.
3. **Thông tin người đăng & Quyền cho thuê**:
   - Vai trò: Chủ sở hữu trực tiếp / Quản lý tòa nhà / Đại diện được ủy quyền / Môi giới.
   - Phạm vi đã xác minh: Đã xác thực SĐT (OTP) / Đã đối soát CCCD / Đã kiểm tra thực địa.
   - Thời điểm cập nhật tình trạng phòng còn trống gần nhất.
4. **Nút phản ánh nhanh**:
   - Báo cáo: "Đã hết phòng", "Giá thực tế khác giá niêm yết", "Không phải người có quyền cho thuê".

---

## 4. Cơ Chế Tin Cậy & Xác Minh 3 Lớp Độc Lập (§7)

Hệ thống phân định rạch ròi 3 lớp xác minh độc lập, không gộp chung thành một nhãn "uy tín" mơ hồ:

```
[Lớp 1: Xác minh Số điện thoại]
- Xác thực qua OTP SMS (CSPRNG, Redis, Rate-limited).
- Ý nghĩa: Người dùng có quyền truy cập số điện thoại tại thời điểm gửi OTP.
- KHÔNG đồng nghĩa là chủ nhà hay người có quyền cho thuê.

[Lớp 2: Xác minh Danh tính Người đăng]
- Đối soát CCCD / Giấy phép kinh doanh đối với đơn vị quản lý.
- Dữ liệu giấy tờ được lưu trữ bảo mật, che mờ (masking), không công khai trên web.
- Ý nghĩa: Đã xác định được danh tính pháp lý của cá nhân/tổ chức đăng tin.

[Lớp 3: Xác minh Quyền cho thuê & Tình trạng Phòng]
- Nhân viên kiểm duyệt đối chiếu bằng chứng quyền cho thuê (hợp đồng quản lý, giấy chứng nhận quyền sử dụng đất, hoặc xác minh tại thực địa).
- Cấp huy hiệu "Đã kiểm tra thực tế" (verificationStatus = 'da_xac_thuc').
- Thu hồi ngay lập tức nếu:
  + Tin đăng bị chỉnh sửa các trường cốt lõi (giá, địa chỉ, ảnh).
  + Quá 7 ngày không xác nhận còn phòng sau thông báo của sàn.
  + Có báo cáo vi phạm có bằng chứng từ khách thuê.
```

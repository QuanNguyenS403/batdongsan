# BUSINESS-MODEL.md — Mô Hình Kinh Doanh & Kinh Tế Đơn Vị

- **Dự án**: Nền tảng Cho thuê QNS
- **Căn cứ**: Mục 4 trong `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)
- **Ngày cập nhật**: 21/09/2026

---

## 1. Quyết Định Mô Hình Cốt Lõi (§4.3)

**Mô hình được phê duyệt**: Marketplace kết nối trực tiếp + Thuê bao bộ công cụ vận hành cho người cho thuê + Dịch vụ quảng bá tùy chọn.

### A. Người thuê (Bên cầu - Khách hàng)
- **Miễn phí 100%**: Tìm kiếm chỗ thuê, lọc theo trường ĐH/tiện ích, xem bảng chi phí chi tiết, lưu tin, gửi lead quan tâm, xem số điện thoại người đăng.
- **Cam kết quyền lợi**: Nền tảng không thu bất kỳ khoản phí môi giới, phí tìm phòng, hay phí xem phòng nào từ người tìm thuê.

### B. Người cho thuê (Bên cung - Chủ phòng, Quản lý tòa nhà, Môi giới)
- **Gói miễn phí cơ bản**: Duy trì mức 3 tin đăng active đồng thời vĩnh viễn (gói Cơ bản / Trial) để trải nghiệm nền tảng mà không bị ép buộc trả tiền ngay.
- **Gói công cụ quản lý trả phí**: Bán công cụ quản lý danh mục phòng, theo dõi nguồn khách liên hệ, cập nhật trạng thái hàng loạt, mở rộng hạn mức tin đăng.
- **Dịch vụ quảng bá tùy chọn**: Đẩy tin lên đầu chuyên mục, làm mới tin (chỉ áp dụng cho tin còn phòng thật).
- **Quy tắc đạo đức**: Không bán "uy tín" hay huy hiệu xác minh bằng tiền; không tự duyệt tin; tin trả phí vẫn phải qua kiểm duyệt và bị hạ nếu hết phòng.

### C. Nền tảng (QNS Thuê)
- **KHÔNG nhận cọc, KHÔNG giữ tiền thuê**: Tránh hoàn toàn các rủi ro pháp lý về trung gian thanh toán, ký quỹ, tranh chấp giữ tiền hay thủ tục hoàn trả phức tạp.
- **KHÔNG mặc định thu hoa hồng hợp đồng**: Hai bên giao dịch trực tiếp ngoài sàn; tránh việc sàn phải tốn chi phí vận hành điều tra hợp đồng thành công.
- Doanh thu của sàn thuần túy là **Doanh thu cung cấp dịch vụ phần mềm/quảng bá** cho bên cho thuê.

---

## 2. Bảng Giá Thử Nghiệm & Cấu Hình Gói (§4.4)

Các mức giá sau đây là **giả thuyết thử nghiệm** phục vụ giai đoạn pilot, chưa phải giá thương mại cố định:

| Gói dịch vụ | Giá thử nghiệm (VNĐ/30 ngày) | Hạn mức tin active | Quyền lợi & Công cụ đi kèm |
|---|---:|---:|---|
| **Cơ bản (Freemium)** | 0 đ | 3 tin | Đăng tin tiêu chuẩn, tiếp nhận lead, xem thống kê cơ bản, kiểm duyệt bắt buộc |
| **Quản lý nhỏ (Pro 10)** | 149.000 đ | 10 tin | Hộp thư khách thuê chuyên biệt, thống kê nguồn khách, cập nhật trạng thái hàng loạt |
| **Vận hành (Business 30)**| 399.000 đ | 30 tin | Công cụ quản lý nhiều phòng trọ/căn hộ, phân quyền nhân sự hỗ trợ khi sẵn sàng |
| **Quy mô lớn (Enterprise)**| Báo giá sau pilot | Không giới hạn | Tích hợp import API, tài khoản theo chi nhánh, hỗ trợ kỹ thuật ưu tiên |

### Nguyên tắc bất biến khi bán gói (Snapshot Guarantee - F04)
- Khi người dùng gửi yêu cầu mua gói, toàn bộ thông số (`maxActiveListings`, `durationDays`, `quotedAmount`, `priceMultiplier`) được chụp lại bất biến vào trường `planSnapshot` (JSON) trên bản ghi `UserMembership`.
- Việc admin thay đổi giá hoặc quyền lợi của catalog sau đó **tuyệt đối không làm thay đổi quyền lợi của các gói đã mua**.

### Quyết định về Surge Pricing (Hệ số giá theo mùa)
- Tạm thời **tắt toàn bộ việc nhân giá mùa cao điểm** trong giai đoạn pilot và ra mắt thương mại ban đầu.
- Tránh làm phương hại tới thông điệp minh bạch của thương hiệu khi giá trị thực tế của nền tảng chưa được chứng minh vượt trội.

---

## 3. Kinh Tế Đơn Vị (Unit Economics) & Ngưỡng Hòa Vốn (§4.5)

### Công thức quản trị:
$$\text{Lãi đóng góp / tài khoản trả phí (CM)} = \text{Doanh thu thuần} - \text{Phí thanh toán} - \text{Chi phí biến đổi (SMS + Email + Server)}$$
$$\text{Số khách trả phí hòa vốn} = \frac{\text{Chi phí cố định hàng tháng}}{\text{Lãi đóng góp bình quân (CM)}}$$
$$\text{Thời gian hoàn vốn CAC} = \frac{\text{Chi phí thu hút 1 khách trả phí (CAC)}}{\text{Lãi đóng góp hàng tháng}}$$

### Kịch bản mô phỏng pilot:
- Doanh thu thuần bình quân: 180.000 đ / khách / tháng.
- Chi phí biến đổi phân bổ (SMS OTP, Email, hạ tầng DB): 45.000 đ / khách / tháng.
- Lãi đóng góp (Contribution Margin): 135.000 đ / khách / tháng.
- Chi phí cố định ước tính ban đầu: 30.000.000 đ / tháng (hạ tầng, kiểm duyệt viên part-time, vận hành).
- $\rightarrow$ Số khách trả phí cần thiết để hòa vốn: $\approx 223$ khách hàng.

---

## 4. Giả Thuyết & Tiêu Chí Nghiệm Thu Pilot (§4.5)

- **Địa bàn thử nghiệm**: 1 khu vực tập trung (ví dụ: Cụm Đại học Quốc gia TP.HCM, Quận Thủ Đức hoặc Quận 10).
- **Thời gian pilot**: 6–8 tuần với 20–30 chủ nhà / đơn vị quản lý tham gia.
- **Chỉ số thành công (Success Metrics)**:
  1. $\ge 90\%$ tin công khai có xác nhận còn phòng trong vòng 7 ngày.
  2. $\ge 80\%$ yêu cầu khách thuê gửi lead được chủ nhà phản hồi trong 24 giờ.
  3. Tỷ lệ tin sai thông tin nghiêm trọng được xác nhận $\le 2\%$.
  4. Lãi đóng góp (CM) trên từng tài khoản trả phí là số dương.

# Hướng Dẫn Tự Động Hóa Thanh Toán Vietcombank 0đ (Phương Án A)

Phương án này giúp bạn nhận tiền và tự động gạch nợ hoa hồng 100% tự động trọn đời, tiền về thẳng tài khoản Vietcombank cá nhân mà không tốn bất kỳ chi phí duy trì hay cổng thanh toán trung gian nào

---

## 1. Bật nhận thông báo biến động số dư qua Email trên VCB Digibank (Miễn phí 100%)

1. Mở ứng dụng **VCB Digibank** trên điện thoại
2. Vào mục **Cài đặt** (hoặc Tiện ích) -> Chọn **Cài đặt thông báo**
3. Tìm mục **Nhận tin biến động số dư qua Email** và bật kích hoạt
4. Điền địa chỉ email của bạn: `ducquan16102006@gmail.com`
5. Xác nhận mã PIN/OTP để hoàn tất kích hoạt

*Mỗi khi có tiền chuyển vào số tài khoản 1050773506, Vietcombank sẽ lập tức gửi một email thông báo về Gmail của bạn*

---

## 2. Cài đặt Google Apps Script trên Gmail (Chỉ cần làm 1 lần trong 3 phút)

1. Mở trình duyệt và truy cập: [https://script.google.com](https://script.google.com) (đăng nhập bằng tài khoản `ducquan16102006@gmail.com`)
2. Bấm nút **Dự án mới (New project)** ở góc trên bên trái
3. Xóa code có sẵn và dán toàn bộ mã nguồn từ file [vietcombank-email-webhook.gs](file:///d:/BĐS/packages/database/scripts/vietcombank-email-webhook.gs) vào
4. Kiểm tra cấu hình trong code:
   * `WEBHOOK_URL`: `https://qnsbroker.com/api/payments/webhook/bank` (khi chạy local dùng URL tunnel)
   * `WEBHOOK_SECRET`: `qns_bank_sec_9f8b42ec31057e7c81d3` (đã được lưu sẵn trong hệ thống)
   * `ACCOUNT_NUMBER`: `1050773506`
5. Bấm icon **Lưu (Save)**
6. Chọn hàm `testConnect` trên thanh công cụ và bấm nút **Chạy (Run)** để cấp quyền đọc Gmail lần đầu
7. Thiết lập chạy tự động mỗi phút:
   * Bấm biểu tượng **Đồng hồ (Trình kích hoạt / Triggers)** ở thanh menu bên trái
   * Bấm nút **+ Thêm trình kích hoạt (+ Add Trigger)** ở góc dưới bên phải
   * Chọn hàm: `checkVietcombankEmails`
   * Chọn nguồn sự kiện: `Theo thời gian (Time-driven)`
   * Chọn loại trình kích hoạt: `Bộ đếm theo phút (Minutes timer)`
   * Chọn khoảng thời gian: `Mỗi phút (Every minute)`
   * Bấm **Lưu (Save)**

---

## 3. Quy trình tự động hóa khép kín sau khi kích hoạt

1. Khách hàng thực hiện giao dịch và quét mã **VietQR** trên website (mã VietQR tự động điền sẵn số tiền và nội dung `QNS_COMM_<mã>`)
2. Tiền chuyển thẳng vào Vietcombank của bạn, Vietcombank bắn email báo tiền về Gmail
3. Google Apps Script tự động đọc email trong vòng 1 phút và gọi Webhook về máy chủ
4. Hệ thống QNS BROKER tự động đối soát, chuyển trạng thái hoa hồng sang **Đã thanh toán (paid)**
5. Telegram Bot `@QNSbroker_bot` tự động gửi thông báo báo tiền về điện thoại của bạn ngay lập tức

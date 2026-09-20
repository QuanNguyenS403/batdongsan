# BẢN THU HOẠCH VÀ ĐẶC TẢ THỰC THI CHO AI AGENT
## Định vị, kinh doanh và hoàn thiện nền tảng cho thuê QNS

Ngày khảo sát: 19/09/2026. Repository: https://github.com/QuanNguyenS403/batdongsan

**Mã nguồn đối chiếu:** `eb99862d8a6887dae0241d8e7302005d699ea40b` (HEAD khi tải về).

**Đề xuất trọng tâm:** Xây dựng nền tảng chuyên cho thuê, nơi người tìm thuê biết chi phí, biết mình đang liên hệ với ai và biết tình trạng còn trống được cập nhật lúc nào. Người thuê tìm kiếm và liên hệ miễn phí; người cho thuê trả phí cho công cụ vận hành và quảng bá có đo lường.

**Slogan đề xuất: “Rõ chi phí. Đúng người cho thuê.”**

Tài liệu này là bản giao việc có thể dùng ngay cho AI agent. Đây không phải chứng nhận bảo mật, báo cáo kiểm toán production hay cam kết lợi nhuận. Đã đọc trực tiếp các luồng mã nguồn trọng yếu và chạy kiểm tra cấu trúc; chưa khởi chạy toàn bộ ứng dụng, chưa kiểm thử với database thật, chưa kiểm tra màn hình bằng trình duyệt, chưa xác minh hạ tầng triển khai hay thông tin doanh thu thực tế. Những nhiệm vụ runtime bên dưới là phần agent phải tiếp tục thực hiện. Không sửa hoặc đẩy mã nguồn trong lần lập báo cáo này.

---

## 1. Kết luận điều hành

Dự án không còn là một bộ giao diện rỗng. Mã nguồn có Next.js App Router, NestJS, Prisma/PostgreSQL; các module xác thực, tin đăng, upload, lead, gói thành viên, kiểm duyệt, sổ giao dịch, audit và tác vụ nền. Vì vậy, phương án hợp lý là sửa và hợp nhất hệ thống hiện tại, tránh viết lại toàn bộ.

Nút thắt lớn nhất là sự thiếu thống nhất giữa **lời hứa trên giao diện, quy tắc kinh doanh và cách backend thực thi**. Ví dụ: trang chủ nói về tin xác thực nhưng schema cho phép tin chưa xác thực; quyền lợi gói được lưu snapshot nhưng tạo tin đọc giới hạn hiện tại của gói; có module outbox nhưng các luồng quan trọng vẫn gửi thông báo trực tiếp hoặc chưa tạo sự kiện.

Ba quyết định cần trở thành nguyên tắc xuyên suốt:

1. **Chuyên cho thuê:** mọi loại chỗ ở, mọi phân khúc giá; không mua bán bất động sản. Mặt bằng/văn phòng có thể là nhánh cho thuê riêng, không chiếm trọng tâm tìm chỗ ở. Không quảng bá đặt phòng du lịch trước khi có nghiệp vụ tương ứng.
2. **Trực tiếp phải có nghĩa cụ thể:** liên hệ chủ sở hữu hoặc người có quyền cho thuê/đại diện được chứng minh. Tài khoản môi giới phải được ghi đúng vai trò; không tự động gắn “chính chủ”.
3. **Uy tín phải kiểm chứng được:** huy hiệu có phạm vi, bằng chứng, ngày xác minh và điều kiện thu hồi. Trả tiền không mua được huy hiệu tin cậy hoặc quyền bỏ qua kiểm duyệt.

Không có cấu hình nào đảm bảo “an toàn tuyệt đối”. Chuyển yêu cầu đó thành tiêu chuẩn đo được: không còn lỗi nghiêm trọng đã biết trong phạm vi kiểm tra, phân quyền được thử bằng tài khoản đối nghịch, tiền được đối soát, dữ liệu khôi phục được, sự cố có người chịu trách nhiệm.

## 2. Phạm vi bằng chứng và cách đọc báo cáo

### 2.1 Đã kiểm tra

- Manifest và cấu trúc monorepo; Next.js `14.2.15`, NestJS dòng `10`, Prisma schema và danh mục migration.
- Auth controller/service, OTP, JWT strategy, guard registration, kiểm tra cấu hình môi trường.
- Luồng tạo/sửa tin, giới hạn tin, trả số điện thoại, upload và điều kiện công khai.
- Luồng lead, DTO đồng ý chia sẻ thông tin, quyền xem/cập nhật.
- Gói thành viên, snapshot, duyệt chuyển khoản, hoàn tiền và thống kê sổ giao dịch.
- Admin controllers, outbox worker, tác vụ nền, đồng bộ Sheets.
- Trang chủ, danh mục route, auth client, công cụ ước tính chi phí và cấu hình Next.js.
- Script `node packages/database/scripts/static-lint-check.js`: **5/5 kiểm tra cấu trúc đạt**. Script chỉ tìm pattern/file; kết quả không chứng minh hành vi đúng, không thay thế lint/typecheck/integration/E2E.

### 2.2 Chưa xác minh

Deployment đang chạy commit nào; toàn bộ API runtime; dữ liệu production; backup thực tế; domain chính thức; tốc độ, responsive và accessibility trên màn hình thật; cấu hình SMS/email/bank thật; sự phù hợp pháp lý của doanh nghiệp; mức sẵn lòng trả tiền và chi phí thu hút khách.

Nhãn dùng trong báo cáo:

- **Xác nhận từ code:** câu lệnh hoặc đường đi dữ liệu hiện hữu.
- **Rủi ro cần thử:** suy luận có cơ sở nhưng cần tái hiện trên môi trường kiểm thử.
- **Đề xuất:** quyết định thiết kế/kinh doanh chưa phải tính năng hiện có.

Ưu tiên P0 = chặn phát hành hoặc chặn nghiệp vụ liên quan; P1 = bắt buộc trước mở rộng thu phí/quy mô; P2 = cải tiến có kế hoạch. Đây là ưu tiên thực thi, không phải điểm CVSS.

## 3. Định vị thương hiệu và lời hứa sản phẩm

### 3.1 Định vị đề xuất

“Nền tảng tìm chỗ thuê minh bạch chi phí, giúp người thuê kết nối trực tiếp với bên có quyền cho thuê, từ phòng trọ đến căn hộ.”

Tên hiện tại trong code có nhiều biến thể: `QNS'bds.vn`, `QNS.vn`, và SMS vẫn dùng “Thue Tro Nhanh”. Dấu nháy và hậu tố BĐS khiến tên khó nhớ, còn “Trọ” dễ giới hạn nhận thức vào giá rẻ. Đề xuất tên làm việc **QNS Thuê** để giữ liên hệ thương hiệu hiện hữu; chưa đổi domain hoặc tuyên bố tên đã được bảo hộ. Kiểm tra tên miền và nhãn hiệu trước khi chốt tên thương mại.

| Thành phần | Nội dung đề xuất | Điều kiện sử dụng |
|---|---|---|
| Slogan | Rõ chi phí. Đúng người cho thuê. | Có các trường phí và quy trình kiểm tra người đăng |
| H1 trang chủ | Tìm chỗ thuê phù hợp, rõ chi phí ngay từ đầu | Không tự điền phí giả khi chủ chưa khai |
| Dòng mô tả | Từ phòng trọ, studio đến căn hộ và nhà nguyên căn. Xem thông tin, so sánh chi phí và liên hệ trực tiếp bên cho thuê. | Liên hệ thật, không dẫn về số của sàn thay cho chủ |
| CTA người thuê | Tìm chỗ thuê | Giữ nguyên bộ lọc khi quay lại |
| CTA người đăng | Đăng chỗ cho thuê | Hiển thị quyền lợi, giới hạn, chi phí trước khi mua |
| Cam kết phí | Nền tảng không thu phí tìm kiếm và liên hệ từ người thuê | Nếu bên đăng thu phí riêng phải công khai, không phủ nhận bằng lời hứa chung |

Hai slogan dự phòng: “Tìm đúng chỗ. Gặp đúng người.” và “Thuê rõ ràng. Ở an tâm.” Slogan chính được chọn vì gắn với hai lợi ích có thể kiểm chứng, không chỉ cảm xúc. Tránh “100% chính chủ”, “không lừa đảo”, “an toàn tuyệt đối”, “chắc chắn có khách” khi hệ thống không thể đảm bảo.

### 3.2 Sự khác biệt nên xây

Mỗi tin có một **bảng thông tin thuê minh bạch** gồm:

- Giá thuê theo đơn vị thời gian; tiền cọc; kỳ thanh toán; thời gian thuê tối thiểu.
- Điện, nước, mạng, quản lý, giữ xe, vệ sinh và các khoản bắt buộc khác; đơn vị tính rõ ràng.
- Phí bên trung gian nếu có; người trả; điều kiện phát sinh.
- Vai trò người đăng; phạm vi đã xác minh; ngày xác minh; ngày xác nhận còn trống.
- Tổng chi phí cố định/tháng; phần chi phí biến đổi là ước tính có giả định; tiền cần chuẩn bị khi vào ở là chỉ số riêng.
- Nút báo “đã hết phòng”, “giá thực tế khác”, “không phải bên có quyền cho thuê”.

Đây là hướng khác biệt đề xuất, không tuyên bố chưa đối thủ nào làm. Khả năng giữ người dùng đến từ dữ liệu đáng tin và kết quả tìm kiếm tốt, không từ slogan riêng lẻ.

### 3.3 Phạm vi và nhịp quay lại

Cho phép nhiều loại chỗ thuê trên cùng cấu trúc dữ liệu. Giai đoạn đầu tập trung nguồn cung ở một khu vực nhỏ có người vận hành được, thay vì trang toàn quốc nhưng mỗi nơi ít tin. Không tự chọn thành phố nếu chưa biết mạng lưới chủ nhà của chủ dự án.

Người thuê không có nhu cầu vào website hằng ngày sau khi đã tìm được nhà. Đo quay lại trong đợt tìm kiếm, lượt mở thông báo phù hợp, giới thiệu bạn bè và quay lại khi chuyển nhà. Với người cho thuê, đo tỷ lệ cập nhật còn phòng, xử lý khách quan tâm và gia hạn gói.

## 4. Nghiên cứu mô hình kinh doanh

### 4.1 Đối chiếu nguồn công khai

| Nguồn khảo sát | Quan sát thực tế | Ý nghĩa cho dự án |
|---|---|---|
| [Phongtro123 – Bảng giá](https://phongtro123.com/bang-gia-dich-vu) | Bảng giá áp dụng 25/06/2026 có tin thường, nhiều cấp VIP và đẩy tin. Giá 30 ngày hiển thị từ 55.080đ tin thường đến 1.560.000đ VIP nổi bật sau giảm giá. | Phí hiển thị là mô hình đã tồn tại; giá của đối thủ không chứng minh website mới có thể bán cùng mức. |
| [Batdongsan – Gói Sài Gòn 1K+](https://trogiup.batdongsan.com.vn/docs/goi-tin-sai-gon-1k-plus) | Chương trình 01/07–30/09/2026: 625.000đ cho 25 tin thường, điều kiện địa bàn/giá thuê và thời hạn cụ thể. | Cần tách số tin, ngày hiển thị, thời hạn dùng gói và điều kiện áp dụng. Không so giá gói khác quyền lợi một cách đơn giản. |
| [Nhà Tốt](https://www.nhatot.com/) | Cung cấp cả mua bán, cho thuê, danh mục rộng và dịch vụ hội viên/doanh nghiệp. | Chuyên sâu về chất lượng kết nối thuê là hướng tập trung hợp lý; không cạnh tranh bằng việc thêm tất cả module của cổng lớn. |

Khảo sát bàn giấy này chưa bao gồm phỏng vấn người dùng, thử trả tiền, dữ liệu chuyển đổi hay chi phí vận hành nội bộ của đối thủ. Không suy ra quy mô thị trường/doanh thu chỉ từ số tin hiển thị.

### 4.2 So sánh lựa chọn doanh thu

| Mô hình | Ưu điểm | Bất lợi | Quyết định |
|---|---|---|---|
| Phí từng tin/thời gian hiển thị | Dễ hiểu, hợp chủ có một căn | Khó bán khi lưu lượng thấp; khuyến khích đăng lại nếu thiết kế sai | Dùng gói tin nhỏ tùy chọn sau pilot |
| Thuê bao theo số căn/phòng trống và công cụ quản lý | Hợp đơn vị nhiều phòng; thu lặp lại; ít phụ thuộc kiểm chứng hợp đồng | Phải có giá trị xử lý khách, cập nhật phòng thật | Nguồn thu lõi đề xuất |
| Quảng bá/ưu tiên hiển thị | Người đăng tự chọn, không cản liên hệ | Có thể làm giảm chất lượng kết quả | Bổ sung, giới hạn vị trí và ghi nhãn tài trợ |
| Thu tiền mỗi lượt hiện số/lead | Gắn với tương tác | Bot, spam, trùng, tranh chấp chất lượng; có thể kích thích thu thập dữ liệu | Chưa áp dụng trong giai đoạn đầu |
| Hoa hồng khi ký hợp đồng | Giá trị gắn kết quả | Hai bên liên hệ ngoài sàn, khó xác minh; tốn vận hành và cần rà pháp lý | Chưa dùng làm nguồn thu chính |
| Nhận cọc/thu tiền thuê hộ | Có thể mở rộng doanh thu | Phức tạp đối soát, hoàn trả, tranh chấp và trách nhiệm | Ngoài phạm vi ban đầu |
| Chụp ảnh/chuẩn hóa tin/hỗ trợ đăng | Có doanh thu sớm và nâng chất lượng | Chi phí nhân sự; khó mở rộng | Thử riêng, báo giá dịch vụ rõ |

### 4.3 Mô hình khuyến nghị

**Marketplace kết nối trực tiếp + thuê bao công cụ cho người cho thuê + quảng bá tự chọn.**

- Người thuê được tìm kiếm, lưu tin, xem thông tin phí và liên hệ miễn phí.
- Người đăng có mức miễn phí đủ trải nghiệm, phù hợp số tin hiện tại để tránh phá quyền lợi đang có.
- Gói trả phí bán số chỗ thuê đang hoạt động và công cụ quản lý, không bán “uy tín”.
- Gói quảng bá không tự duyệt tin, không làm tin hết phòng sống lại, không bỏ qua bộ lọc người dùng.
- Không giữ cọc/tiền thuê; nền tảng chỉ thu phí dịch vụ của chính mình.
- Không tự động tính lượt bấm số điện thoại thành “khách đủ điều kiện” hoặc “thuê thành công”.

Một người đại diện có thể quản lý nhiều căn, nhưng từng căn phải có căn cứ quyền đăng. Nếu tiếp nhận môi giới, gắn nhãn rõ; luồng “trực tiếp bên có quyền cho thuê” chỉ bao gồm những người đủ bằng chứng. Không hứa mọi tin là chính chủ khi vẫn cho môi giới không có ủy quyền tham gia.

### 4.4 Giá thử nghiệm, không phải giá tối ưu đã chứng minh

| Gói đề xuất | Giá thử nghiệm | Quyền lợi cần kiểm chứng |
|---|---:|---|
| Cơ bản | 0đ | Giữ mức 3 tin active + pending hiện có trong giai đoạn chuyển đổi; liên hệ miễn phí; kiểm duyệt bắt buộc |
| Quản lý nhỏ | 149.000đ/30 ngày | Tối đa 10 tin; hộp khách quan tâm; thống kê nguồn khách; cập nhật trạng thái hàng loạt |
| Đơn vị vận hành | 399.000đ/30 ngày | Tối đa 30 tin; công cụ quản lý nhiều căn; phân công khách khi tính năng sẵn sàng |
| Quy mô lớn | Báo giá sau pilot | Quyền theo nhóm/chi nhánh, tích hợp nhập liệu, SLA cụ thể |

Các mức trên là giả thuyết thử nghiệm. Chưa bao gồm kết luận VAT; cần công bố rõ giá đã/chưa gồm thuế sau khi kế toán chốt. Không mở bán quyền lợi chưa làm xong. Gói có hiệu lực 30 ngày không đồng nghĩa mỗi tin mặc nhiên còn phòng 30 ngày. Hết gói xử lý theo chính sách chuyển về miễn phí và cho người đăng chọn tin giữ lại, không xóa dữ liệu.

Tạm tắt nhân giá mùa cao điểm cho lần ra mắt thương mại. Code hiện có `PricingSeason` nhưng tăng giá theo mùa khi chưa chứng minh giá trị dễ làm thông điệp minh bạch thiếu thuyết phục. Giữ lịch sử giao dịch và snapshot; nếu sau này dùng lại phải công khai giá cuối cùng, thời điểm hiệu lực và không đổi giá đơn đang chờ trong thời hạn báo giá.

### 4.5 Kinh tế đơn vị và điều kiện mở rộng

Công thức quản trị:

- Lãi đóng góp mỗi tài khoản trả phí = doanh thu dịch vụ thuần sau thuế gián thu/hoàn tiền − phí thanh toán − SMS/email − chi phí kiểm duyệt, hỗ trợ và hạ tầng biến đổi phân bổ.
- Số khách hòa vốn xấp xỉ = chi phí cố định tháng / lãi đóng góp bình quân một khách trả phí.
- Thời gian hoàn vốn CAC = chi phí tìm một khách trả phí / lãi đóng góp tháng của khách đó.

Ví dụ giả định, không phải dự báo: doanh thu thuần bình quân 180.000đ/khách/tháng, biến phí 45.000đ, chi phí cố định 30 triệu → cần khoảng 223 khách trả phí để hòa vốn. Nếu chỉ 10% người đăng hoạt động trả phí thì cần khoảng 2.230 người đăng hoạt động với cơ cấu đó. Nếu doanh thu bình quân giảm 20%, lãi đóng góp còn 99.000đ và cần khoảng 304 khách. Không được bỏ qua lương/công sức owner khi tính lợi nhuận.

Pilot đề xuất: 20–30 cuộc phỏng vấn chia đều chủ nhỏ, đơn vị nhiều phòng và người thuê; vận hành 6–8 tuần ở một cụm địa bàn. Đo tỷ lệ tin được liên hệ thực, phản hồi hai chiều, báo sai thông tin, gia hạn và chi phí hỗ trợ. Ngưỡng thử ban đầu: ≥90% tin công khai có xác nhận còn trống trong 7 ngày; ≥80% yêu cầu được phản hồi trong 24 giờ; tỷ lệ tin sai nghiêm trọng đã xác nhận <2%; lãi đóng góp gói trả phí dương. Đây là mục tiêu nội bộ, không phải chuẩn ngành hay kết quả thực tế.

Chỉ mở rộng địa bàn khi nguồn cung hiện tại đủ tốt và có người xử lý báo cáo. Chưa đạt thì sửa chất lượng nguồn cung và trải nghiệm trước khi tăng ngân sách quảng cáo.

## 5. Phát hiện kỹ thuật và backlog ưu tiên

Các đường dẫn dưới đây tương đối với root repository ở commit đã nêu. Agent phải đọc lại HEAD trước khi sửa; nếu đã được sửa thì kiểm chứng, không áp dụng lại máy móc.

### F01 — P0: Next.js nằm trong dải phiên bản có cảnh báo bảo mật

**Bằng chứng:** `apps/web/package.json` khóa `next: 14.2.15`, ứng dụng dùng App Router. [Thông báo chính thức Next.js 11/12/2025](https://nextjs.org/blog/security-update-2025-12-11) liệt kê dòng 14.x bị ảnh hưởng DoS RSC và bản sửa 14.2.35 cho cảnh báo đó. Không suy diễn thành RCE cho cấu hình này.

**Việc làm:** đối chiếu advisory và lockfile hiện tại, nâng lên bản còn được hỗ trợ và đã vá các cảnh báo áp dụng tại thời điểm thực thi; kiểm tra Next/React/Nest/Multer/Sharp và phụ thuộc bắc cầu. 14.2.35 chỉ là mốc vá của thông báo đã đọc, không được mặc định là bản an toàn mới nhất.

**Nghiệm thu:** dependency inventory/SBOM, báo cáo SCA theo phiên bản thực cài, build và E2E sau nâng cấp; không còn cảnh báo nghiêm trọng áp dụng mà chưa xử lý. Không chạy payload DoS trên production.

### F02 — P0 nghiệp vụ tiền: Duyệt tiền chấp nhận dữ liệu tài chính thiếu

**Bằng chứng:** `modules/membership/membership.service.ts#approveRequest` tự tạo mã `BANK_MANUAL_...` nếu thiếu mã ngân hàng; thiếu `confirmedAmount` thì lấy `quotedAmount`. Controller nhận từng `@Body(...)` primitive thay vì DTO ràng buộc số tiền.

**Tác động:** admin có thể ghi tiền đã thu dù chưa có bằng chứng thanh toán. Đây là lỗi kiểm soát tài chính trong luồng có quyền admin, chưa phải bằng chứng người ngoài sửa được tiền.

**Sửa:** yêu cầu mã tham chiếu thật hoặc mã chứng từ thủ công có bằng chứng, nguồn, thời gian và lý do; số tiền nguyên dương, trong giới hạn; quyết định rõ thiếu/thừa tiền. Không tự coi giá báo là tiền đã nhận. Xác nhận quyền tài chính, idempotency và transaction bao trùm thanh toán/quyền lợi/audit.

**Test:** thiếu mã/số tiền, chuỗi sai, âm, thập phân, vượt giới hạn đều bị từ chối; duyệt song song chỉ có một bút toán; cùng mã ngân hàng không được dùng cho hai đơn.

### F03 — P0 nghiệp vụ tiền: Hoàn tiền thiếu giới hạn và bằng chứng chi

**Bằng chứng:** `membership.service.ts#refundRequest` chuyển `refundAmount` bằng BigInt, chưa kiểm tra số dương và không vượt số tiền còn được hoàn; ghi `refund` và cho gói expired trong cùng transaction. Controller thiếu DTO hoàn tiền chuyên biệt.

**Sửa:** tách yêu cầu hoàn, phê duyệt, thực chi và đối soát; chỉ ghi tiền đã hoàn khi có bằng chứng thực chi. Số hoàn lũy kế không vượt tiền thực thu hợp lệ. Định nghĩa rõ hoàn một phần có giữ quyền lợi không; hoàn gói đã hết hạn xử lý theo chính sách, không bị chặn vô lý chỉ vì trạng thái.

**Test:** hoàn âm/0/quá tiền/sai kiểu; hai yêu cầu đồng thời; retry timeout; hoàn một phần rồi hoàn phần còn lại; không ghi “đã hoàn” nếu thao tác ngân hàng thất bại.

### F04 — P1: Quyền lợi gói đã mua không thống nhất

**Bằng chứng:** `membership.service.ts#getMyMembership` đọc `planSnapshot.maxActiveListings`; `listings.service.ts#create` lại đọc `activeMembership.plan.maxActiveListings`. Duyệt gói dùng `request.plan.durationDays`, không lấy thời hạn từ snapshot đã mua.

**Sửa:** một dịch vụ xác định quyền lợi hiệu lực, dùng snapshot bất biến cho thời hạn, quota, phạm vi; mọi API và UI cùng sử dụng. Dữ liệu cũ không có snapshot cần backfill có dấu vết và chính sách fallback rõ.

**Test:** mua gói 10 tin/30 ngày, admin đổi danh mục thành 3 tin/7 ngày → gói đã mua vẫn đúng 10/30; số quota ở UI và POST tạo tin giống nhau.

### F05 — P1: Kiểm tra quota và ghi tin tách rời

**Bằng chứng:** `listings.service.ts#create` đọc count rồi `listing.create` ngoài một cơ chế khóa quota theo người đăng. Upload cũng đọc số ảnh rồi ghi ảnh riêng.

**Rủi ro:** yêu cầu đồng thời có thể vượt quota/tối đa ảnh. Cần test cạnh tranh để xác nhận runtime.

**Sửa:** transaction với khóa phù hợp hoặc cơ chế giữ slot nguyên tử; serialize cạnh tranh theo chủ tin/tin. Không chỉ dựa vào disabling nút frontend.

**Test:** còn một slot, gửi 20 yêu cầu song song → chỉ một thành công; 19 ảnh đang có, hai upload đồng thời → tổng không vượt 20 và không để file mồ côi.

### F06 — P1: OTP chưa phù hợp nhiều instance

**Bằng chứng:** `auth/otp.service.ts` dùng `Map`, sinh mã bằng `Math.random`; xóa record sau xác thực/thất bại tối đa, record chứa cả bộ đếm gửi. Đã có adapter SMS và production chặn provider mock, nên không kết luận “chưa có SMS thật”.

**Sửa:** CSPRNG; store dùng chung với TTL; tách rate-limit gửi khỏi OTP lifecycle; xác thực một lần bằng thao tác nguyên tử; không log OTP/PII ở production; hạn mức theo IP/điện thoại/thiết bị và chống tiêu tiền SMS. Kiểm tra mã phản hồi nghiệp vụ provider, không chỉ HTTP status. Ràng buộc cấu hình staging và production không mâu thuẫn.

**Test:** gửi ở instance A xác thực ở B; restart không phá luồng ngoài chính sách; resend không reset giới hạn đoán; mã không tái sử dụng; lỗi nhà mạng không trả thông báo thành công.

### F07 — P1: Thu hồi token chưa bắt buộc claim phiên

**Bằng chứng:** `auth.service.ts#refresh` và `strategies/jwt.strategy.ts#validate` chỉ đối chiếu tokenVersion khi claim không undefined. Refresh tiếp tục phát cặp token, chưa thấy quản lý refresh token một lần/session family trong các file đã đọc. `auth-client.ts` lưu access và refresh token trong localStorage.

**Sửa:** bắt buộc claim phiên, có kế hoạch vô hiệu hóa token legacy; session/refresh rotation và phát hiện dùng lại; lưu refresh trong cookie HttpOnly Secure với SameSite phù hợp, bổ sung CSRF/origin controls cho luồng cookie; đồng bộ refresh nhiều tab. Đây là giảm tác động nếu có XSS, không phải bằng chứng XSS đang tồn tại.

**Test:** logout/khóa/đổi mật khẩu/đổi quyền chặn token cũ; token thiếu version bị chặn; refresh cũ không dùng lại; hai request hết hạn đồng thời không làm người dùng đăng xuất ngẫu nhiên.

### F08 — P1: Bootstrap admin public cần thu hẹp

**Bằng chứng:** `POST /auth/bootstrap-admin` public, có secret và throttle; service có thể tạo hoặc nâng vai trò tài khoản đang có.

**Sửa:** ưu tiên CLI vận hành sẵn có, khóa HTTP bootstrap ở production hoặc bật một lần trong chế độ provisioning kiểm soát chặt; vô hiệu hóa sau dùng, audit và thu hồi phiên khi đổi quyền/mật khẩu. Không gọi đây là endpoint hoàn toàn không bảo vệ vì hiện đã kiểm tra secret.

**Test:** production từ chối HTTP bootstrap; người không có quyền không tự nâng role; provisioning có nhật ký và không lộ secret.

### F09 — P1: Outbox chưa nối đủ vào nghiệp vụ và chưa phục hồi worker chết

**Bằng chứng:** membership gửi email bằng `void ...`; create lead không ghi outbox. `outbox.service.ts#processPendingBatch` chỉ lấy PENDING; đặt PROCESSING nhưng không dùng `workerId/lockedUntil` đã có trong schema. Session advisory lock lấy/nhả qua các lệnh Prisma riêng không đảm bảo cùng connection. Khi lỗi lấy lock có fallback coi như đã khóa.

**Sửa:** domain write và outbox write trong cùng transaction; worker claim nguyên tử có lease, reclaim hết lease; lỗi distributed locking phải fail closed. Dùng row locking/claim thích hợp, không giữ transaction DB trong lúc chờ network. Idempotency phía consumer; retry có giới hạn, DLQ và cảnh báo.

**Test:** commit lead rồi kill process; kill worker sau claim; hai worker song song; SMS/email/Sheets lỗi; hệ thống phục hồi, không mất sự kiện và không tạo hành động tiền trùng. Không hứa exactly-once email nếu nhà cung cấp không hỗ trợ.

### F10 — P1: Kiểm tra trạng thái tin ở lead chưa đồng nhất

**Bằng chứng:** `leads.service.ts#createLead` kiểm tra `status === active`, chưa kiểm tra expiresAt/owner.isBlocked như luồng reveal phone. Có DTO bắt `consent === true`, không được kết luận thiếu kiểm tra consent hoàn toàn.

**Sửa:** tái sử dụng một policy xác định tin có được công khai/nhận liên hệ; ghi policy version, thời gian và phạm vi đồng ý. Optional authentication cần xử lý rõ ở public route để không bỏ mất requesterId.

**Test:** tin active nhưng đã hết hạn, chủ bị khóa, tin removed/rented đều không nhận lead mới; chủ khác không đọc/sửa lead; không chia sẻ lead sang chủ khác khi chưa được đồng ý.

### F11 — P1 sản phẩm: Công cụ minh bạch chi phí dùng giả định dễ hiểu nhầm

**Bằng chứng:** `MoveInCostEstimator.tsx` mặc định tiền cọc khi không có, giá điện/nước, mạng 100.000đ; waterAmount khởi tạo 4 và dùng chung cho m³ hoặc số người. `depositAmount` numeric 0 rơi vào fallback truthy, trong khi chuỗi “0” khác hành vi.

**Sửa:** phân biệt chưa khai báo/0/đã bao gồm; đơn vị nước bắt buộc; không lấy số m³ làm số người; nhãn “giả định bạn đang tính” tách “chủ nhà đã khai”; không tự coi thiếu thông tin là miễn phí. Tính riêng chi phí hàng tháng và khoản thanh toán lúc vào ở.

**Test:** cọc 0 dạng số/chuỗi; nước theo người/theo tháng/m³; điện nước đã gồm nhưng internet riêng; phí quản lý/xe; null; không âm/NaN.

### F12 — P1 vận hành: Admin đang gộp quyền lớn

**Bằng chứng:** enum `UserRole` gồm user/broker/admin; controllers tài chính và kiểm duyệt cùng yêu cầu admin. Chưa thấy MFA/TOTP trong phần auth đã khảo sát.

**Sửa:** phân quyền theo capability: kiểm duyệt, hỗ trợ, tài chính, quản trị hệ thống; MFA cho admin, step-up khi đổi tài khoản nhận tiền/xuất PII/hoàn tiền; nhật ký đọc dữ liệu nhạy cảm. Owner một người vẫn phải tách quyền logic; sau này có nhân sự áp dụng maker-checker.

**Test:** nhân viên kiểm duyệt không hoàn tiền; hỗ trợ không xuất tất cả khách; tài chính không tự cấp superadmin; API không dựa vào ẩn nút UI để bảo vệ.

### F13 — P1 cần kiểm chứng: Tính bất biến sổ tiền/audit

**Bằng chứng:** schema đặt tên FinanceLedger/AuditEvent và có transaction khi duyệt tiền. Tên/comment “append-only” không chứng minh quyền DB thực tế; chưa xác minh tài khoản DB production, trigger và quyền sửa/xóa.

**Sửa:** tài khoản ứng dụng chỉ được thao tác cần thiết; cấm sửa/xóa ledger theo đường nghiệp vụ, điều chỉnh bằng bút toán đảo; audit thay đổi quyền và truy xuất nhạy cảm; backup ngoài quyền ghi ứng dụng.

**Test:** app role thử UPDATE/DELETE ledger phải bị từ chối theo thiết kế; tổng tiền khớp chứng từ; phục hồi backup giữ số dư và tham chiếu.

### F14 — P1/P2: Upload và lấy ảnh từ ngoài cần siết phạm vi

**Bằng chứng:** có giới hạn MIME/dung lượng và chuyển WebP bằng Sharp; lưu trên local disk. `next.config.mjs` cho phép ảnh HTTPS hostname `**`.

**Sửa:** allowlist nguồn ảnh; giới hạn tổng request, pixel, CPU, timeout; kiểm tra bytes bằng decoder; quota storage; dọn file mồ côi; storage chia sẻ nếu nhiều instance. Không khẳng định SSRF đã khai thác được chỉ từ wildcard.

**Test:** giả MIME, ảnh lỗi/ảnh rất lớn, thiếu quyền, upload đồng thời, DB thất bại sau ghi file, instance khác phục vụ ảnh.

### F15 — P2: Giao diện và tài liệu không cùng một định vị

**Bằng chứng:** trang chủ có tên khác nhau, mô tả du lịch và nhấn mạnh sinh viên; README đầu nói pivot cho thuê nhưng nhiều phần sau vẫn kiến trúc mua bán/vay. `/mua-ban` hiện redirect sang `/thue`, không phải trang bán hoạt động. Có file LoanCalculatorWidget không đồng nghĩa widget đang được render.

**Sửa:** chuẩn hóa brand config; cập nhật nội dung theo phạm vi đã chốt; tìm import trước khi xóa component; xử lý route cũ theo giá trị SEO và dữ liệu, không xóa hàng loạt schema.

**Test:** crawl link/menu/meta/email/SMS; không còn lời hứa không tương ứng tính năng; route cũ có redirect/410 hợp lý.

### F16 — P2: Trang chủ làm mất phân biệt lỗi API và không có tin

**Bằng chứng:** trang chủ dùng Promise.all cho bốn nhóm rồi catch chung; thất bại một nhóm có thể khiến toàn bộ biến kết quả vẫn null; production hiển thị thông báo chưa có tin. Production đã tắt fallback demo, đây là điểm nên giữ.

**Sửa:** tách trạng thái lỗi/empty; cho các nhóm độc lập có kết quả; quan sát lỗi phía server; nút thử lại hoặc fallback thông tin phù hợp.

**Test:** một API nhóm lỗi nhưng nhóm khác vẫn hiện; không đưa dữ liệu demo vào production; không nói “chưa có tin” khi thực chất hệ thống mất kết nối.

## 6. Thiết kế sản phẩm và review giao diện cần thực hiện

Đánh giá hiện tại là review cấu trúc và logic frontend, chưa phải đánh giá thị giác từng màn hình. Agent phải chạy ứng dụng rồi lưu ảnh trước/sau trên mobile và desktop.

| Khu vực | Giữ | Sửa/thêm | Bỏ hoặc ẩn khi chưa sẵn sàng |
|---|---|---|---|
| Trang chủ | Search, nhóm loại thuê, CTA đăng tin | Giá/ngân sách/khu vực ngay đầu; thương hiệu thống nhất; ưu tiên tin còn trống | Mô tả du lịch, lời hứa xác thực chung chung, khối dài không dẫn tới hành động |
| Kết quả tìm | Bộ lọc khu vực/giá/loại | Giữ filter trong URL; thứ tự có giải thích; nhãn tài trợ; bản đồ nếu dữ liệu đủ | Trộn quảng cáo sai bộ lọc; số liệu giả |
| Chi tiết tin | Gallery, lưu tin, báo cáo, liên hệ | Bảng phí, vai trò, xác nhận còn trống, độ tin cậy, ngày vào ở | Nhãn chính chủ không bằng chứng; phí tự điền |
| Đăng/sửa tin | Upload, trường tiện ích | Draft/autosave, phí theo đơn vị, preview, trạng thái từng ảnh, quyền đại diện | Yêu cầu không liên quan loại thuê |
| Quản lý tin | Tin của tôi và trạng thái | Còn trống/đã thuê/tạm dừng; nhắc cập nhật; quota hiệu lực | Bắt đăng tin trùng để đổi trạng thái |
| Khách quan tâm | Leads đã có | Liên hệ → đã phản hồi → hẹn xem → kết quả; ghi nguồn và consent | Gọi mọi lượt click là khách đã thuê |
| Giá dịch vụ | Gói, quota, ngày hiệu lực | Giá cuối, snapshot, chính sách hết hạn/hoàn | Quyền lợi chưa triển khai; surge tự động giai đoạn đầu |
| Trang phụ | Giới thiệu, liên hệ, điều khoản | Thông tin pháp nhân thật, tiêu chí xác minh, xử lý khiếu nại | Trang coming soon trên menu chính nếu không có giá trị |

Yêu cầu UX: thử 360/390/768/1440px; bàn phím và focus; nhãn input; thông báo lỗi cạnh trường; mobile CTA không che nội dung; OTP có thể dán mã; không mất form sau đăng nhập; dùng định dạng VND nhất quán. Mục tiêu hiệu năng đề xuất: p75 LCP ≤2,5s, INP ≤200ms, CLS ≤0,1; báo riêng số đo lab và số đo người dùng thật, không giả mạo đạt field metrics khi chưa đủ traffic.

SEO: canonical cho filter, sitemap chỉ tin hợp lệ theo chính sách, noindex khu vực riêng tư, metadata theo trang, không index lead/token/admin; không tạo hàng loạt trang địa bàn trống. Địa danh cần mã ổn định, alias lịch sử và danh mục có version; không giả định cây hành chính ba cấp trong code luôn khớp dữ liệu hiện hành. Kiểm tra nguồn chính thức tại lúc cập nhật.

## 7. Cơ chế tin cậy và quản lý nguồn cung

Tách ba việc: xác minh số điện thoại; xác minh danh tính; xác minh quyền cho thuê. OTP chỉ chứng minh quyền sử dụng số ở thời điểm xác minh, không chứng minh sở hữu nhà.

Quy trình đề xuất:

1. Người đăng chọn vai trò và kê khai quyền đăng theo từng tài sản.
2. Hệ thống kiểm tra cấu trúc, ảnh trùng, địa điểm/giá bất thường; chỉ đánh dấu để kiểm tra, không tự kết luận gian lận.
3. Nhân viên đối chiếu bằng chứng tối thiểu cần thiết; che dữ liệu không cần thiết, giới hạn thời hạn lưu.
4. Duyệt nội dung và cấp huy hiệu đúng phạm vi riêng biệt.
5. Nhắc xác nhận còn phòng theo chu kỳ 7 ngày thử nghiệm; sau thời gian ân hạn chưa xác nhận thì giảm hiển thị hoặc tạm ẩn theo chính sách công khai.
6. Sửa thông tin quan trọng thì xét duyệt lại và thu hồi huy hiệu liên quan. Tin trả phí cũng áp dụng.
7. Báo cáo nghiêm trọng có bằng chứng → hạn chế hiển thị tạm thời, kiểm tra, cho bên đăng phản hồi và có khiếu nại.

Không công khai giấy tờ định danh/quyền sở hữu trên tin. Không yêu cầu người thuê nộp căn cước chỉ để xem phòng. Lưu timestamp và policy version của việc đồng ý chia sẻ lead; yêu cầu marketing là lựa chọn riêng. Đánh giá sau giao dịch phải có cơ chế chứng minh tương tác, chống đánh giá giả và quyền phản hồi.

## 8. Admin: thiết kế để vận hành và kiểm soát tiền

### 8.1 Ba bảng tổng quan của owner

| Bảng | Câu hỏi | Chỉ số |
|---|---|---|
| MONEY | Thu/chi thực ở đâu, lệch gì? | Thu đã đối soát, tiền chờ xác nhận, hoàn đã thực chi, nghĩa vụ hoàn còn chờ, doanh thu dịch vụ theo kỳ, chi phí, số giao dịch lệch |
| GROWTH | Nguồn cung tốt và kết nối có tăng không? | Tin còn trống mới xác nhận, chủ hoạt động, người thuê có liên hệ, phản hồi hai chiều, hẹn xem, gia hạn trả phí, CAC, lãi đóng góp |
| RISK | Có vấn đề gì cần xử lý ngay? | Báo gian lận, tin chưa cập nhật, sự cố auth, thao tác quyền cao, xuất dữ liệu, đối soát lỗi, outbox tồn, backup/restore gần nhất |

Tiền vào ròng không đồng nghĩa lợi nhuận; lead không đồng nghĩa hợp đồng; gói pending không đồng nghĩa doanh thu. Có drill-down đến chứng từ hoặc sự kiện nguồn, lọc thời gian và múi giờ Asia/Ho_Chi_Minh cho nghiệp vụ báo cáo, lưu timestamp chuẩn trong database.

### 8.2 Module vận hành bắt buộc

- Tin đăng: xem bản công khai và bằng chứng, duyệt/từ chối có lý do, lịch sử sửa, so sánh phiên bản, xử lý theo hàng đợi.
- Người dùng: khóa/mở khóa, thu hồi session, quản lý vai trò, chống tự khóa tài khoản quản trị cuối cùng, không hiển thị password/token.
- Xác minh: loại bằng chứng, người duyệt, ngày hết hiệu lực, lịch sử thu hồi.
- Khách quan tâm: quyền theo tin/tổ chức, phân công có audit, xuất giới hạn, che số khi không cần.
- Tài chính: đơn dịch vụ, chứng từ thanh toán, đối soát, chênh lệch, hoàn tiền, sổ giao dịch và báo cáo.
- Gói/giá: version quyền lợi, ngày hiệu lực, giá công khai, không sửa hồi tố quyền đã mua.
- Báo cáo/khiếu nại: mức độ, người phụ trách, thời gian xử lý và trạng thái thông báo.
- Vận hành: job, retry/DLQ, tích hợp, quota SMS, storage và cảnh báo.

Google Sheets chỉ là bản xuất hỗ trợ, database là nguồn chính. Giới hạn trường xuất, quyền chia sẻ sheet, thời hạn giữ và xử lý yêu cầu xóa. Không fallback mock rồi báo thành công như một lần đồng bộ thật trong production.

## 9. Đặc tả API, auth và dữ liệu cho đợt thực thi

### 9.1 Kiểm kê API bắt buộc

Agent tạo `api-inventory.csv` với method, path, controller/service, auth, role/capability, kiểm tra ownership, DTO, dữ liệu trả ra, rate-limit, side effect, idempotency và test. Sinh từ routes thật; không lấy danh sách dự kiến trong README làm sự thật.

| Nhóm đang có | Kiểm tra trọng tâm |
|---|---|
| `/auth/*` | Enumeration, OTP abuse, token lifecycle, bootstrap, session revocation |
| `/listings`, `/listings/:idOrSlug` | Tin active + còn hạn + chủ hợp lệ; không lộ phone/PII từ API công khai, HTML hay JSON hydration |
| `/listings/:id/images` và CRUD | Ownership, quota nguyên tử, file limits, trạng thái duyệt lại |
| `/listings/:id/reveal-phone` | Tài khoản hợp lệ, hạn mức chống crawl, trạng thái tin, sự đồng ý công khai liên hệ của người đăng |
| `/leads`, `/leads/mine`, `/leads/admin`, cập nhật lead | Consent, anti-spam, dữ liệu theo chủ, retention |
| `/admin/membership-requests/*` | Quyền tài chính, số tiền, chứng từ, idempotency, cạnh tranh |
| `/admin/finance/summary`, `/admin/audit-events` | Tính chính xác, pagination validation, che PII, phạm vi truy cập |
| `/admin/outbox/dlq*` | Retry an toàn, không tái phát sinh thu/hoàn |
| Locations/universities/health và các route còn lại | Giới hạn đầu vào/đầu ra, cache, không tiết lộ cấu hình nội bộ |

Các API bổ sung như lịch hẹn, xác nhận còn trống và quản lý bằng chứng phải được đặc tả OpenAPI trước khi phát triển; không tuyên bố chúng đang tồn tại.

### 9.2 Kiểm thử bảo mật toàn diện

Dùng [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/) làm taxonomy tham chiếu: kiểm tra quyền theo đối tượng/chức năng/trường, xác thực, tiêu thụ tài nguyên và API phụ thuộc. Đặc tả dưới đây là yêu cầu dự án, không phải tuyên bố đạt chứng chỉ OWASP.

- Ma trận guest/user A/user B/broker/moderator/finance/admin: thử truy cập ngang và dọc mọi endpoint.
- Kiểm tra mass assignment role/status/verified/pricePaid; schema DTO runtime, không chỉ TypeScript.
- Injection ở query, raw SQL, HTML mô tả, URL, template email, CSV/Sheets; không đưa dữ liệu người dùng trực tiếp vào biểu thức thực thi.
- Giới hạn request/pageSize, timeout, body size, upload, truy vấn tìm kiếm tốn chi phí; rate-limit dùng chung khi scale; cấu hình proxy/IP đúng.
- HTTPS, cookie, CORS allowlist, CSP/security headers; cache riêng tư không chia sẻ giữa tài khoản.
- Scan secret trong repository và lịch sử bằng công cụ không in giá trị bí mật vào báo cáo; rotate nếu có lộ, xóa khỏi code chưa đủ.
- Quản lý dependency/lockfile, build reproducible, artifact integrity và quyền CI tối thiểu.
- Log che PII/secret; lỗi trả ra có request ID, thông tin chẩn đoán ở log nội bộ phù hợp quyền.

### 9.3 Database và migration

Giữ PostgreSQL/Prisma trừ khi đo đạc chứng minh cần thay. Bổ sung có kế hoạch: session/refresh family; bằng chứng xác minh riêng tư; availability timestamp; phí có đơn vị; order/payment/refund theo vòng đời; permission và assignment theo tổ chức nếu cần.

Ràng buộc database: tiền nguyên VND và giới hạn hợp lệ; số hoàn ≤ số được hoàn qua giao dịch nguyên tử; tham chiếu ngân hàng duy nhất theo namespace nhà cung cấp/tài khoản; FK phù hợp retention; index theo truy vấn đã đo; uniqueness chống trùng. `CHECK` đơn lẻ không đủ bảo vệ quy tắc tổng nhiều hàng khi có cạnh tranh.

Migration theo expand → backfill → đối chiếu → chuyển code → contract. Không reset database, không seed đè người dùng, không xóa cột cũ trước khi kiểm tra tham chiếu. Snapshot/backup trước migration; rehearsal trên bản sao đã ẩn danh; lưu row counts và totals tiền trước/sau. Rollback code phải tương thích schema; với migration không thể đảo thì có kế hoạch roll-forward và restore được thử.

## 10. Các quyết định pháp lý và vận hành cần đóng trước mở bán

Chưa có đủ căn cứ trong lần khảo sát này để kết luận doanh nghiệp thuộc chính xác loại hình pháp lý nào hoặc đã đáp ứng nghĩa vụ nào. Tên “nền tảng công nghệ” hoặc việc không giữ cọc không tự động loại trừ nghĩa vụ pháp lý.

Agent phải lập hồ sơ dựa trên **hoạt động thực tế**: quảng cáo/tin đăng; dịch vụ kết nối; có tham gia đàm phán/môi giới hay không; nhận tiền gì; thu thập dữ liệu gì; chia sẻ cho ai. Đối chiếu văn bản đang hiệu lực tại lúc triển khai về kinh doanh bất động sản, thương mại điện tử, bảo vệ dữ liệu cá nhân, người tiêu dùng, hóa đơn và thuế. Phần này cần nguồn văn bản cụ thể, điều khoản và người có chuyên môn xác nhận; không dùng kết quả search tiêu đề làm tư vấn pháp lý hoàn chỉnh.

Danh sách đầu ra: thông tin pháp nhân, quy chế đăng tin, hợp đồng dịch vụ người đăng, tiêu chí xác minh, điều khoản thu/hoàn, chính sách dữ liệu/retention, quy trình khiếu nại, nghĩa vụ đăng ký/thông báo nếu áp dụng. Chưa chốt được mục liên quan thì đánh dấu blocker đúng phạm vi; vẫn hoàn tất các sửa kỹ thuật độc lập.

## 11. Lộ trình thực thi và cổng nghiệm thu

| Đợt | Công việc | Điều kiện hoàn thành |
|---|---|---|
| 0 – Chụp hiện trạng | Commit, routes, schema/migrations, env inventory không secret, chạy app, ảnh UI, baseline tests | Có bản đồ hệ thống và issue register; phân biệt code/runtime/unknown |
| 1 – Chặn rủi ro trọng yếu | F01–F03; bảo vệ admin/tiền; auth và dữ liệu nhạy cảm phát hiện thêm | Không còn P0 trong phạm vi phát hành; test lỗi trước/sau; chức năng tiền khóa nếu chưa đủ điều kiện |
| 2 – Sửa tính nhất quán | F04–F10, outbox, upload, quota, migration | Integration PostgreSQL/Redis, concurrency và failure recovery đạt |
| 3 – Thực thi định vị | Brand, phí, vai trò, trạng thái phòng, UI/mobile và kiểm duyệt | E2E đủ hành trình; copy phù hợp thực tế; không demo production |
| 4 – Admin và thu phí | RBAC/MFA, đối soát, gói snapshot, hoàn tiền, audit | Tiền/chứng từ/quyền lợi khớp; các vai trò không vượt quyền |
| 5 – Pilot | Nguồn cung thật tại địa bàn tập trung, hỗ trợ và đo lường | Có dữ liệu phản hồi/gia hạn/biến phí; quyết định tiếp tục hoặc điều chỉnh |
| 6 – Mở rộng | Thêm địa bàn, tổ chức, quảng bá nâng cao | Vận hành và unit economics đạt ngưỡng đã định |

Không đặt thời hạn giả trước khi biết baseline, nhân lực và hạ tầng. Agent phải ước lượng sau đợt 0, báo phụ thuộc và cập nhật khi có bằng chứng mới.

### Bộ nghiệm thu tối thiểu

1. Người thuê lọc/lưu/xem chi phí/liên hệ đúng người; quay lại không mất bộ lọc; lỗi mạng không hiện thành dữ liệu trống giả.
2. Chủ A đăng/sửa/upload chỉ tin của mình; user B không truy cập qua đổi ID; sửa phần quan trọng đưa tin về duyệt lại.
3. Tin hết hạn/đã thuê/chủ bị khóa ngừng công khai và ngừng nhận lead đúng policy.
4. Gói miễn phí/trả phí/hết hạn/gia hạn/nâng/hạ cấp có quyền lợi xác định; snapshot không bị đổi khi sửa danh mục.
5. Duyệt tiền/hoàn/retry/song song không sai số và không trùng; pending không là tiền thu; có đối soát chứng từ.
6. OTP nhiều instance, brute-force/rate-limit, thu hồi session, MFA/admin và recovery đều có test hành vi.
7. Worker chết giữa chừng khôi phục được; provider lỗi có retry/DLQ; không mất sự kiện.
8. Restore backup trên môi trường tách biệt thành công, kiểm tra dữ liệu và totals. Mục tiêu khởi điểm đề xuất RPO ≤24h, RTO ≤4h; khi giao dịch tăng phải siết theo mức tổn thất chấp nhận được.
9. Build/typecheck/lint thật + SCA + integration + E2E trong CI; không dùng script kiểm tra chuỗi thay cho test nghiệp vụ.
10. Có ảnh desktop/mobile trước/sau, kết quả accessibility/performance, danh sách vấn đề tồn và người chịu trách nhiệm.

## 12. Cơ chế buộc AI agent làm đến nơi đến chốn

### 12.1 Hồ sơ bàn giao bắt buộc

Agent duy trì trong repository hoặc bộ tài liệu dự án:

- `CURRENT-STATE.md`: commit, kiến trúc thật, cấu hình, giới hạn khảo sát.
- `BUSINESS-MODEL.md`: đối tượng, nguồn thu, giá, miễn phí, quyền lợi, chi phí, giả thuyết pilot.
- `BRAND-AND-TRUST.md`: tên, slogan, copy, vai trò và bằng chứng xác minh.
- `api-inventory.csv`: toàn bộ endpoint thật và kiểm soát tương ứng.
- `ISSUE-REGISTER.md`: ID, mức độ, bằng chứng, cách tái hiện an toàn, nguyên nhân, sửa, regression test, commit, trạng thái.
- `PERMISSION-MATRIX.md`: vai trò × hành động × dữ liệu được phép thấy.
- `DATA-AND-FINANCE-RULES.md`: tiền, trạng thái, snapshot, concurrency, retention và migration.
- `TEST-EVIDENCE.md`: lệnh, môi trường, thời gian, pass/fail/skipped, log rút gọn và ảnh.
- `RUNBOOK.md`: triển khai, rollback, backup/restore, sự cố, đối soát, provider down.
- `RELEASE-READINESS.md`: đã đạt/chưa đạt/không áp dụng; rủi ro còn lại và điều kiện phát hành.

Mẫu issue:

`ID | Priority | Evidence type | File/function | Reproduction | Expected | Actual | Root cause | Fix commit | Regression test | Status | Remaining risk`

Trạng thái hợp lệ: `discovered → reproduced/confirmed-by-code → fixing → verified → closed`; nếu thiếu môi trường thì `blocked` kèm lý do. Không đóng issue chỉ vì đã sửa file hoặc có comment “FIXED”. Không ghi 100% hoàn thành nếu test chưa chạy, provider mock, migration chưa rehearse hoặc production chưa đối chiếu.

### 12.2 Chỉ thị có thể sao chép giao cho agent

> Bạn là AI agent chịu trách nhiệm hoàn thiện repository `https://github.com/QuanNguyenS403/batdongsan` theo toàn bộ bản thu hoạch này. Mục tiêu là nền tảng chuyên cho thuê mọi phân khúc, minh bạch chi phí, kết nối đúng bên có quyền cho thuê, vận hành và thu phí có kiểm soát.
>
> Trước tiên đọc AGENTS.md nếu có, toàn bộ cấu hình cần thiết và HEAD hiện tại. Commit tham chiếu của báo cáo là `eb99862d8a6887dae0241d8e7302005d699ea40b`; báo cáo là danh sách bằng chứng khởi điểm, không thay thế việc đọc code mới nhất. Không tự nhận đã kiểm toán toàn diện nếu chưa có bằng chứng runtime.
>
> Giữ kiến trúc Next.js/NestJS/Prisma/PostgreSQL trừ khi chứng minh được lý do thay. Lập bản đồ routes, dữ liệu, auth, admin, tiền, tích hợp và deployment; chạy baseline trong môi trường cô lập. Hoàn thành đợt 0 rồi thực thi các đợt tiếp theo, không dừng ở kế hoạch hoặc chỉ sửa giao diện. Nếu gặp blocker, hoàn thành phần độc lập còn làm được và báo đúng phụ thuộc.
>
> Thực hiện mô hình đề xuất: người thuê miễn phí, gói công cụ cho người cho thuê, quảng bá tùy chọn; không nhận cọc/tiền thuê và không mặc định thu hoa hồng hợp đồng. Các mức giá trong báo cáo là thử nghiệm: triển khai cấu hình/version/feature flag, không tự bật thu tiền thật hoặc quảng cáo trả phí khi chưa có quyết định thương mại. Quyền lợi đã bán phải được bảo toàn.
>
> Triển khai slogan “Rõ chi phí. Đúng người cho thuê.” cùng cơ chế chứng minh: phí theo đơn vị, người đăng đúng vai trò, bằng chứng quyền cho thuê, xác nhận còn phòng và xử lý báo cáo. Không dùng trả phí để mua huy hiệu xác minh; không tạo tin/đánh giá/số liệu giả để làm trang có vẻ đông khách.
>
> Ưu tiên F01–F03 và mọi lỗ hổng nghiêm trọng mới tìm thấy; tiếp tục F04–F16 và kiểm tra đầy đủ các lớp còn lại. Mỗi lỗi phải có bằng chứng, cách sửa và test phù hợp. Kiểm tra ownership, RBAC, DTO, token, OTP, upload, phụ thuộc, SQL/HTML/CSV injection, cache riêng tư, quota, concurrency, outbox, tiền, hoàn tiền, backup và audit. Không bỏ sót lỗi nhỏ: đưa vào issue register và xử lý theo mức ảnh hưởng.
>
> Với tiền: không tự điền chứng từ hoặc coi giá báo là thực thu; mọi ghi nhận/hoàn có số tiền hợp lệ và bằng chứng. Dùng transaction, uniqueness và idempotency; thử song song và retry. Admin phải có MFA, quyền tối thiểu, audit, đối soát và bảng MONEY/GROWTH/RISK.
>
> Review UI trên ứng dụng đang chạy bằng desktop/mobile, giữ các phần tốt, chỉ bỏ phần thừa sau khi kiểm tra import, route, SEO và dữ liệu phụ thuộc. Phân biệt lỗi mạng với empty state. Thực thi toàn bộ hành trình người thuê, người đăng và admin đến kết quả cuối.
>
> Không thao tác phá hủy dữ liệu thật, reset production database, sửa số tiền lịch sử hay xóa bằng chứng. Không commit secret hoặc dữ liệu cá nhân; dùng test data cô lập. Migration phải có backup, rehearsal, đối chiếu và rollback/roll-forward. Sửa trên nhánh riêng, tạo thay đổi review được; phát hành production chỉ khi đã đạt cổng nghiệm thu và có quyền triển khai phù hợp. Không coi yêu cầu lập báo cáo này là quyền chuyển tiền hoặc mở bán thật.
>
> Duy trì đầy đủ hồ sơ bàn giao ở mục 12.1. Báo cáo mỗi đợt: đã xác minh gì, sửa gì, test nào đã chạy, test nào chưa chạy, blocker nào còn, tác động dữ liệu và bước tiếp theo. Không dùng test tìm chuỗi trong source làm bằng chứng tích hợp. Không tự cho phép bỏ qua lỗi nghiêm trọng để báo hoàn thành.
>
> Kết thúc bằng commit/PR, bảng yêu cầu đã đáp ứng, bằng chứng test và trạng thái sẵn sàng phát hành. Mọi yêu cầu chưa hoàn thành phải có lý do cụ thể. Không hứa an toàn tuyệt đối hoặc lợi nhuận chắc chắn; chứng minh các kiểm soát và chỉ số thực tế.

## 13. Nguồn và giới hạn kết luận

Nguồn mã nguồn chính: [repository tại commit khảo sát](https://github.com/QuanNguyenS403/batdongsan/tree/eb99862d8a6887dae0241d8e7302005d699ea40b). Đường dẫn file và tên hàm ở mục 5 cho phép tái đối chiếu từng phát hiện. Comment/README có nhãn “đã sửa” không được coi là bằng chứng hành vi đúng.

Nguồn thị trường được đọc ngày 19/09/2026: [Phongtro123](https://phongtro123.com/bang-gia-dich-vu), [gói Batdongsan](https://trogiup.batdongsan.com.vn/docs/goi-tin-sai-gon-1k-plus), [Nhà Tốt](https://www.nhatot.com/). Giá/chương trình có thể thay đổi; chỉ dùng đúng phạm vi và ngày hiệu lực đã nêu.

Nguồn bảo mật: [Next.js advisory](https://nextjs.org/blog/security-update-2025-12-11), [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/). Không dùng nguồn này để khẳng định đã kiểm thử production hoặc đã đạt tiêu chuẩn chứng nhận.

Phần mô hình, giá pilot, tên làm việc, slogan, KPI và kiến trúc bổ sung là khuyến nghị của báo cáo. Chưa có dữ liệu thực nghiệm để gọi đây là mô hình tối ưu chắc chắn; cơ chế pilot và các cổng nghiệm thu được thiết kế để kiểm chứng trước khi mở rộng.

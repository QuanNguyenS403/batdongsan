# README — Phân tích Mogi.vn & Kiến trúc đề xuất cho dự án Bất động sản tương tự

> 🟢 **Cập nhật quan trọng (Pivot 05/09/2026):** Dự án đã chính thức **PIVOT 100% sang mô hình Nền tảng trung gian (broker) chuyên biệt "Cho thuê"** (phòng trọ sinh viên, studio, căn hộ chung cư, nhà nguyên căn, mặt bằng kinh doanh). Loại bỏ hoàn toàn mảng mua bán nhà đất. Nền tảng kết nối trực tiếp Người thuê với Chủ phòng/Môi giới qua SĐT/Zalo; nền tảng KHÔNG xử lý cọc hay tiền thuê. Bổ sung hệ thống thông báo Email và đồng bộ Google Sheets cho quản trị viên. Chi tiết trạng thái thực thi: xem [`TRANG-THAI-TRIEN-KHAI.md`](./TRANG-THAI-TRIEN-KHAI.md).

> Tài liệu này (1) phân tích toàn diện website tham chiếu **Mogi.vn** (giao diện, nội dung, bố cục, UX, frontend, backend suy luận) và (2) chuyển hóa các phân tích đó thành **bản thiết kế kiến trúc kỹ thuật** để thực thi một dự án website bất động sản (mua bán / cho thuê nhà đất) tương tự.
>
> Nguồn khảo sát: truy cập trực tiếp `mogi.vn` (trang chủ, trang danh sách tin theo khu vực, trang chi tiết tin đăng, trang giá nhà đất, trang dự án, trang tìm môi giới, trang phí thành viên/bảng giá dịch vụ) vào thời điểm viết tài liệu (08/2026). Các kết luận về công nghệ backend/frontend là **suy luận kỹ thuật dựa trên dấu vết quan sát được** (URL pattern, cấu trúc HTML, thẻ meta, subdomain...), không phải thông tin nội bộ chính thức từ đội ngũ Mogi — cần coi là giả thuyết tham khảo, không phải sự thật tuyệt đối.

---

## Mục lục

1. [Tổng quan mô hình sản phẩm](#1-tổng-quan-mô-hình-sản-phẩm)
2. [Kiến trúc thông tin (Sitemap) đã khảo sát](#2-kiến-trúc-thông-tin-sitemap-đã-khảo-sát)
3. [Phân tích giao diện (UI) & bố cục từng loại trang](#3-phân-tích-giao-diện-ui--bố-cục-từng-loại-trang)
4. [Phân tích trải nghiệm & luồng sử dụng (UX Flows)](#4-phân-tích-trải-nghiệm--luồng-sử-dụng-ux-flows)
5. [Phân tích nội dung & chiến lược SEO](#5-phân-tích-nội-dung--chiến-lược-seo)
6. [Phân tích Frontend (suy luận công nghệ)](#6-phân-tích-frontend-suy-luận-công-nghệ)
7. [Phân tích Backend & hạ tầng (suy luận công nghệ)](#7-phân-tích-backend--hạ-tầng-suy-luận-công-nghệ)
8. [Mô hình kinh doanh & dòng tiền](#8-mô-hình-kinh-doanh--dòng-tiền)
9. [Đề xuất Tech Stack cho dự án mới](#9-đề-xuất-tech-stack-cho-dự-án-mới)
10. [Kiến trúc hệ thống tổng thể (đề xuất)](#10-kiến-trúc-hệ-thống-tổng-thể-đề-xuất)
11. [Thiết kế cơ sở dữ liệu (đề xuất)](#11-thiết-kế-cơ-sở-dữ-liệu-đề-xuất)
12. [Cấu trúc thư mục dự án (đề xuất)](#12-cấu-trúc-thư-mục-dự-án-đề-xuất)
13. [Danh mục API cần xây dựng](#13-danh-mục-api-cần-xây-dựng)
14. [Danh mục trang / component cần xây dựng](#14-danh-mục-trang--component-cần-xây-dựng)
15. [Roadmap triển khai theo giai đoạn](#15-roadmap-triển-khai-theo-giai-đoạn)
16. [Checklist đối chiếu tính năng với Mogi.vn](#16-checklist-đối-chiếu-tính-năng-với-mogivn)
17. [Rủi ro, giới hạn & khuyến nghị](#17-rủi-ro-giới-hạn--khuyến-nghị)

---

## 1. Tổng quan mô hình sản phẩm

Mogi.vn là một **sàn giao dịch bất động sản dạng rao vặt (classifieds marketplace)**, thuộc **Công ty Cổ phần Định Anh** — cùng hệ sinh thái với `Muaban.net` (rao vặt tổng hợp) và `Vieclam.net` (tuyển dụng). Mô hình lõi:

- **Bên cung**: Cá nhân môi giới, công ty môi giới, chủ đầu tư dự án — đăng tin bán/cho thuê nhà đất.
- **Bên cầu**: Người mua/thuê nhà — tìm kiếm, lọc, xem chi tiết, liên hệ trực tiếp với người đăng tin.
- **Vai trò nền tảng**: Trung gian kết nối + thu phí từ bên cung (phí thành viên đăng tin, phí đẩy tin/VIP), không thu phí giao dịch từ bên mua.
- **Giá trị gia tăng phụ trợ**: Dữ liệu giá nhà đất theo khu vực, danh bạ môi giới, review khu vực, công cụ vay mua nhà (liên kết ngân hàng), blog/tin tức bất động sản để kéo traffic tự nhiên (SEO).

Đây là mô hình **hai phía (two-sided marketplace) + content hub**, không phải một cửa hàng thương mại điện tử bán sản phẩm trực tiếp.

---

## 2. Kiến trúc thông tin (Sitemap) đã khảo sát

```
mogi.vn/                                   → Trang chủ
├── /mua-nha-dat                           → Tìm mua (toàn quốc)
├── /thue-nha-dat                          → Tìm thuê (toàn quốc)
├── /{tinh-thanh}/mua-nha-dat              → VD: /ho-chi-minh/mua-nha-dat
│   └── /{tinh-thanh}/{quan-huyen}/mua-{loai-hinh}
│       └── /{quan-huyen}/{loai-tin}/{slug-tieu-de}-id{ID}   → Trang chi tiết tin đăng
├── /gia-nha-dat                           → Bảng giá nhà đất theo khu vực (toàn quốc)
│   └── /gia-nha-dat-{quan-huyen}-qd{ID}   → Chi tiết giá 1 khu vực (biểu đồ + tin liên quan)
├── /du-an                                 → Danh sách dự án BĐS
│   └── /{slug-du-an}-prj{ID}              → Trang chi tiết dự án
├── /tim-moi-gioi                          → Danh bạ môi giới
│   ├── /tim-moi-gioi/{tinh-thanh}-cid{ID} → Lọc theo tỉnh/thành
│   └── /moi-gioi/{sdt}-{slug}-uid{ID}     → Trang cá nhân môi giới
├── /tra-cuu-sau-sap-nhap                  → Công cụ tra cứu địa giới hành chính (tính năng mới)
├── /review-khu-vuc                        → Review khu vực sinh sống
├── /phong-tro-gan-truong                  → Tìm phòng trọ gần trường học (landing page ngách)
├── /phong-tro-gan-kcn                     → Tìm phòng trọ gần khu công nghiệp (landing page ngách)
├── /10-buoc-mua-nha                       → Cẩm nang/hướng dẫn mua nhà
├── /vay-mua-nha                           → Công cụ/landing vay mua nhà (liên kết ngân hàng)
├── /dang-tin                              → Đăng tin mới (yêu cầu đăng nhập)
├── /dang-nhap                             → Đăng nhập / Đăng ký (modal + trang riêng)
├── /trang-ca-nhan/quan-ly-tin             → Quản lý tin đã đăng (dashboard người dùng)
├── /trang-ca-nhan/thong-tin-ca-nhan       → Thông tin tài khoản
├── /trang-ca-nhan/tim-kiem-da-luu         → Tìm kiếm đã lưu + Thông báo
├── /trang-ca-nhan/bat-dong-san-yeu-thich  → BĐS đã lưu (yêu thích)
├── /trang-ca-nhan/doi-mat-khau            → Đổi mật khẩu
├── /lien-he/gui-lien-he                   → Liên hệ
├── /news/                                 → Tin tức bất động sản (blog)
└── /logoff                                → Đăng xuất

pro.mogi.vn/                               → Cổng mua/quản lý phí thành viên (redirect vào /dang-nhap nếu chưa auth)
trogiup.mogi.vn/                           → Trung tâm trợ giúp + blog + bảng giá dịch vụ (WordPress riêng biệt)
cloud.mogi.vn/                             → CDN ảnh tin đăng, ảnh dự án, avatar
cdn.mogi.vn/                               → CDN banner quảng cáo, asset tĩnh
cdnnews.mogi.vn/                           → CDN ảnh bài viết tin tức
```

**Nhận xét kiến trúc URL:**
- URL được **thiết kế chuẩn SEO tiếng Việt không dấu**, có cấu trúc phân cấp địa lý rõ ràng: `tỉnh/thành` → `quận/huyện` → `loại giao dịch + loại hình` → `slug tiêu đề + ID số`.
- Mỗi loại thực thể có **tiền tố ID riêng biệt** giúp phân biệt route: `id` (tin đăng), `prj` (dự án), `uid` (người dùng/môi giới), `qd` (khu vực giá), `cid` (tỉnh/thành trong danh bạ môi giới), `wid` (phường/xã), `sid` (đường/phố). Đây là **gợi ý rất mạnh** cho việc mỗi loại đối tượng có bảng dữ liệu riêng và bộ định danh (ID) riêng, không dùng UUID mà dùng ID số tăng dần (auto-increment).
- Nhiều subdomain tách theo chức năng (ứng dụng lõi / CMS nội dung / CDN ảnh) — một mô hình **đa dịch vụ (multi-service)** chứ không phải một khối nguyên (monolith) duy nhất cho toàn bộ hệ sinh thái.

---

## 3. Phân tích giao diện (UI) & bố cục từng loại trang

### 3.1 Trang chủ (Homepage)

| Vùng bố cục | Nội dung / Thành phần |
|---|---|
| Header cố định | Logo (SVG) — Menu ngang: Tra cứu sáp nhập (badge "New") / Tìm mua / Tìm thuê / Giá nhà đất / Phí thành viên / Môi giới / Dự án — Nút Đăng nhập/Đăng ký — Nút CTA nổi bật "Đăng tin mới" |
| Hero section | Tiêu đề cảm xúc thương hiệu ("An tâm chọn, An tâm mua") + Tab chuyển đổi **Tìm mua / Tìm thuê / Giá nhà đất** + Thanh tìm kiếm chính (địa điểm, loại hình, khoảng giá...) |
| Khối "Tiện ích từ Mogi.vn" | Dãy thẻ/link ngang dẫn tới các tính năng phụ trợ: Review khu vực, Phòng trọ gần trường, Phòng trọ công nhân, 10 bước mua nhà, Vay mua nhà — **mục đích: điều hướng cross-sell nội bộ, tăng số trang/phiên** |
| Khối liên kết SEO theo khu vực | 4–6 cột liên kết tĩnh nhóm theo: "BĐS TPHCM", "BĐS Hà Nội", "Mua bán BĐS (tỉnh khác)", "Cho thuê nhà đất" — mỗi cột 5–6 link tới các trang danh mục con (silo SEO) |
| Footer | 5 cột: Về Mogi (giới thiệu, điều khoản) / Đối tác - Thông tin (liên kết chéo Muaban.net, Vieclam.net) / Công cụ - Tiện ích / Dịch vụ - Quảng cáo / Thông tin liên hệ (logo, hotline 2 miền, email, mạng xã hội) — Khối pháp lý cuối trang (tên công ty, người chịu trách nhiệm, số giấy phép, địa chỉ trụ sở, badge Bộ Công Thương + DMCA) |

**Đặc điểm UI đáng chú ý:**
- Header có **2 lớp menu**: menu desktop dạng thanh ngang cố định + menu ẩn (hamburger/drawer) dùng chung dữ liệu cho responsive/mobile — thấy rõ HTML render 2 lần cùng bộ link cho 2 breakpoint khác nhau (phổ biến khi frontend không dùng CSS-only responsive mà render server-side 2 biến thể).
- Trạng thái đăng nhập thay đổi toàn bộ vùng bên phải header: chưa đăng nhập → "Đăng nhập/Đăng ký"; đã đăng nhập → avatar + dropdown (Quản lý tin, Thông tin tài khoản, Thông báo, BĐS đã lưu, Tìm kiếm đã lưu, Đổi mật khẩu, Thoát).

### 3.2 Trang danh sách tin (Search/Listing Results)

Ví dụ: `/ho-chi-minh/mua-nha-dat`

| Vùng | Nội dung |
|---|---|
| Breadcrumb | Mogi › Mua bán nhà đất › [Tên khu vực hiện tại] |
| Tiêu đề H1 động | "Mua bán nhà đất TPHCM giá rẻ, vị trí thuận lợi, đầy đủ pháp lý T{tháng}/{năm}" — **tiêu đề tự sinh theo tháng/năm hiện tại** |
| Bộ đếm kết quả | "1 - 15 trong 543.618" — hiển thị tổng số tin phù hợp bộ lọc |
| Danh sách thẻ tin (card) | Mỗi thẻ: ảnh đại diện (+ số lượng ảnh), tiêu đề (link), khu vực, diện tích/PN/WC dạng icon, giá (định dạng "x tỷ y triệu"), thời gian đăng ("Hôm nay") |
| Phân trang | Dạng số trang (1,2,3…8, "Trang kế") — **không phải infinite scroll**, là phân trang truyền thống server-render |
| Khối nội dung SEO dài (dưới danh sách) | Bài viết dài 1000+ từ: giới thiệu khu vực, bảng giá tham khảo theo quận, tổng quan địa lý/dân số/hành chính/giao thông/hạ tầng/kinh tế, các loại hình BĐS phổ biến, phong thủy, lưu ý khi mua bán, liên kết nội bộ tới các trang lân cận |
| Khối liên kết chân trang | Lặp lại cấu trúc 5 cột như trang chủ |

**Nhận xét UX/Content:** Trang danh sách **kết hợp 2 mục đích**: (1) công cụ tìm kiếm thực dụng ở nửa trên, (2) trang nội dung SEO dài ở nửa dưới để xếp hạng từ khóa dài (long-tail keyword). Đây là mẫu hình rất phổ biến ở các site rao vặt/BĐS Việt Nam.

### 3.3 Trang chi tiết tin đăng (Listing Detail)

Ví dụ: `/quan-10/mua-can-ho-chung-cu/{slug}-id{ID}`

| Vùng | Nội dung |
|---|---|
| Breadcrumb | Mogi › Mua bán nhà đất › TPHCM › Quận 10 › [Tên dự án/khu vực] |
| Gallery ảnh | Ảnh lớn + dãy ảnh thumbnail bên dưới (multi-image) |
| Tiêu đề + vị trí + giá | H1 tiêu đề tin, địa chỉ đầy đủ, giá nổi bật, nút "Lưu tin" |
| Bảng "Thông tin chính" | Diện tích, số phòng ngủ, số nhà tắm, tình trạng pháp lý (Sổ hồng/Sổ đỏ), ngày đăng, **Mã BĐS (ID)** |
| Mô tả chi tiết | Nội dung tự do do người đăng nhập (thường có icon/emoji, định dạng xuống dòng, số điện thoại liên hệ chèn trong nội dung) |
| Nút "Báo vi phạm" | Cho phép người dùng report tin sai/lừa đảo |
| Khối người đăng (môi giới) | Avatar, tên, "Đã tham gia: X năm Y tháng", link tới trang cá nhân môi giới |
| "Có thể bạn muốn xem" | Liên kết nội bộ theo khu vực/dự án tương tự (internal linking cho SEO + điều hướng) |
| Khối "Tiện ích xung quanh" | Lặp lại thông tin môi giới + số điện thoại (dạng "bấm để hiện số") + nút "Gửi tin nhắn" |
| Widget vay mua nhà | Logo ngân hàng đối tác (UOB) + nút "Vay mua nhà" mở popup ước tính khoản vay (nhập giá trị nhà, thời hạn, trả trước %, lãi suất → tính khoản trả hàng tháng) |
| Modal xác thực | Bắt buộc đăng nhập mới xem được số điện thoại/gửi tin nhắn — luồng đăng nhập bằng **SĐT + OTP** hoặc **Google** |

**Đặc điểm UX quan trọng — "Content gating":** Số điện thoại người đăng ẩn dưới nút "Bấm để hiện số" và việc nhắn tin yêu cầu đăng nhập. Đây là **cơ chế thu thập lead/dữ liệu người dùng** và hạn chế bot/spam cào số điện thoại.

### 3.4 Trang giá nhà đất (`/gia-nha-dat`)

- Danh sách quận/huyện dạng bảng: **Tên khu vực | Giá trung bình (triệu/m²) | % biến động (▲/▼) so với kỳ trước** — tách riêng 2 bảng cho TPHCM và Hà Nội.
- Có ô tìm kiếm khu vực riêng.
- Nội dung SEO dài phía dưới giải thích cách tra cứu, yếu tố ảnh hưởng giá, hướng dẫn 3 bước sử dụng công cụ.
- Trang con `/gia-nha-dat-{khu-vuc}-qd{ID}` (không truy cập sâu trong khảo sát này) được suy đoán chứa biểu đồ lịch sử giá theo thời gian + danh sách tin liên quan khu vực đó.
- Mogi công bố mô hình định giá dùng **AI phân tích trên 2.000.000+ tin đăng** của Mogi.vn và Muaban.net — cho thấy có một **pipeline xử lý dữ liệu lớn/thống kê giá theo khu vực định kỳ**, tách biệt với luồng CRUD tin đăng thông thường.

### 3.5 Trang Dự án (`/du-an`)

- Danh sách thẻ dự án: ảnh đại diện, tên dự án, chủ đầu tư, khu vực + năm bàn giao, khoảng giá khởi điểm (tổng tiền + đơn giá/m²), 2 nút trạng thái "Đang bán"/"Cho thuê" liên kết tới danh sách tin thuộc dự án đó, danh sách bài viết tin tức liên quan tới dự án (nếu có).
- Cho thấy **mô hình dữ liệu Dự án (Project)** là một thực thể độc lập, có quan hệ 1-nhiều với Tin đăng (một dự án có nhiều tin rao bán/cho thuê căn hộ thuộc dự án đó) và quan hệ với bài viết Blog (gắn thẻ dự án).

### 3.6 Trang danh bạ Môi giới (`/tim-moi-gioi`)

- Thẻ môi giới: avatar, tên, badge "Đã xác thực CMND", thời gian tham gia, số điện thoại, số tin đang đăng, danh sách khu vực hoạt động (tag).
- Bộ lọc theo tỉnh/thành (đường link tĩnh có số lượng môi giới kèm theo, dạng "TPHCM (490)").
- → Gợi ý: mỗi môi giới có **hồ sơ xác thực (KYC cơ bản bằng CMND/CCCD)**, hệ thống đếm số tin đang active theo thời gian thực.

### 3.7 Trang phí thành viên / bảng giá dịch vụ

- `pro.mogi.vn` là **cổng riêng cho việc mua gói/membership**, được bảo vệ bằng đăng nhập (redirect thẳng vào `/dang-nhap` nếu chưa xác thực).
- `trogiup.mogi.vn/bang-gia-phi-thanh-vien` (WordPress) hiển thị **bảng giá công khai** dạng ảnh info-graphic, kèm quy tắc tính: đơn vị 30 ngày, gói dùng thử (Trial = miễn phí 30 ngày/3 tin), cách tính ngày hết hạn tin (dựa trên lần "làm mới" hoặc "mua dịch vụ TOP-UP" gần nhất), gói theo khu vực (mua thêm khu vực phải cùng hạng gói).

---

## 4. Phân tích trải nghiệm & luồng sử dụng (UX Flows)

### 4.1 Luồng người tìm nhà (Buyer/Renter — không cần tài khoản để xem)
```
Trang chủ → chọn Tìm mua/Tìm thuê → nhập bộ lọc (khu vực, loại hình, giá...)
 → Trang danh sách kết quả → click 1 tin → Trang chi tiết
 → xem ảnh/mô tả/giá → muốn liên hệ → [Gate] yêu cầu đăng nhập (OTP/Google)
 → đăng nhập thành công → hiện số điện thoại / mở khung nhắn tin
 → (tuỳ chọn) Lưu tin / Lưu tìm kiếm để nhận thông báo sau
```

### 4.2 Luồng người đăng tin (Seller/Broker)
```
Đăng ký tài khoản (SĐT + mật khẩu, xác thực OTP)
 → Đăng nhập → (nếu chưa có gói) mua Phí thành viên theo khu vực + hạng gói
 → "Đăng tin mới" → điền thông tin BĐS (loại hình, khu vực, diện tích, giá,
    hình ảnh, mô tả, pháp lý...) → gửi duyệt
 → Vào "Quản lý tin bất động sản" → theo dõi trạng thái, làm mới tin,
    mua dịch vụ đẩy tin/VIP/TOP-UP để tăng hiển thị
 → Nhận liên hệ qua số điện thoại/tin nhắn từ người mua
```

### 4.3 Luồng xác thực (Authentication)
- Đăng ký: Họ, Tên, Số điện thoại (10 số, validate định dạng VN), Mật khẩu (6–50 ký tự, giới hạn bộ ký tự) → đồng ý điều khoản → xác thực OTP gửi qua SMS.
- Đăng nhập: theo mật khẩu, hoặc **Google OAuth**, hoặc luồng quên mật khẩu bằng OTP qua SĐT.
- → **SĐT là định danh chính (primary identifier)**, không phải email — phù hợp thói quen người dùng Việt Nam và giúp giảm tài khoản ảo/spam vì SĐT cần xác thực OTP thật.

### 4.4 Luồng tính năng phụ trợ
- **Ước tính khoản vay**: nhập giá trị nhà, thời hạn, % trả trước, lãi suất → tính ngay khoản trả hàng tháng (JS thuần phía client) → có nút "Liên hệ tư vấn khoản vay" nối vào form thu thập lead gửi cho ngân hàng đối tác.
- **Báo vi phạm tin đăng**: cơ chế kiểm duyệt cộng đồng, khả năng có hàng đợi duyệt nội bộ (admin/mod).

---

## 5. Phân tích nội dung & chiến lược SEO

Đây là điểm rất đáng học hỏi để "hình dung cấu trúc" cho dự án riêng:

1. **SEO lập trình (Programmatic SEO)**: Với ~500.000+ tin ở TPHCM, hệ thống tự sinh hàng chục nghìn trang danh mục tổ hợp `{khu vực} × {loại giao dịch} × {loại hình BĐS}` (VD: `/quan-7/mua-can-ho`, `/quan-8/thue-nha`...). Mỗi tổ hợp có tiêu đề, meta description, H1 tự sinh **kèm biến thời gian động** (`T8/2026`) để luôn "mới" trong mắt Google.
2. **Nội dung dài dạng "content pillar"** gắn ở cuối mỗi trang danh mục lớn: thông tin địa lý/dân số/hành chính/giao thông/hạ tầng/kinh tế khu vực + FAQ — mục tiêu chiếm các cụm từ khóa thông tin (informational keywords), không chỉ từ khóa giao dịch (transactional keywords).
3. **Internal linking dày đặc**: mỗi trang đều có khối liên kết tới các khu vực/loại hình liên quan (footer 5 cột lặp lại toàn site + khối "Xem thêm" trong bài + "Có thể bạn muốn xem" ở trang chi tiết).
4. **Breadcrumb + Schema ẩn (khả năng có JSON-LD dù không thấy trực tiếp trong bản rút trích)**: cấu trúc phân cấp rõ ràng hỗ trợ rich snippet.
5. **Tách content site khỏi app site**: blog/tin tức/trợ giúp chạy trên **WordPress** (`trogiup.mogi.vn`) — tách biệt khỏi ứng dụng lõi để đội content có thể tự vận hành mà không phụ thuộc release cycle của kỹ sư backend.
6. **Meta đầy đủ**: Open Graph, Twitter Card, canonical URL, `meta-robots: index,follow` cho hầu hết trang công khai.
7. **Google Tag Manager** (`GTM-WC9T99`) làm lớp trung gian quản lý toàn bộ tracking (Analytics, Facebook Pixel, remarketing...) thay vì hard-code từng script.

---

## 6. Phân tích Frontend (suy luận công nghệ)

> ⚠️ Phần này là **suy luận kỹ thuật** dựa trên dấu vết quan sát (không phải xác nhận chính thức).

| Dấu hiệu quan sát được | Suy luận |
|---|---|
| Trang render đầy đủ HTML nội dung ngay lần tải đầu (không rỗng chờ JS) | **Server-Side Rendering (SSR)** hoặc trang tĩnh render phía server — thân thiện SEO, phù hợp mô hình rao vặt |
| Có 2 khối menu giống hệt nhau lặp lại trong cùng HTML (desktop + mobile drawer) | Frontend server-render sẵn cả 2 biến thể giao diện, dùng CSS/JS chỉ để ẩn/hiện — kiểu templating truyền thống (Razor/PHP) hơn là SPA/CSR thuần |
| Nhiều modal (đăng nhập, OTP, ước tính khoản vay, liên hệ ngân hàng) cùng tồn tại ẩn trong DOM của mọi trang | Modal được render sẵn toàn cục (global partials/layout), điều khiển qua JS (khả năng cao dùng jQuery — phổ biến với các site .NET thế hệ trước) |
| Responsive qua `meta viewport` + bố cục dạng thẻ (card grid) | CSS framework tự viết hoặc dựa trên Bootstrap/tương đương (phổ biến trong hệ sinh thái ASP.NET MVC) |
| Ảnh tải từ subdomain riêng `cloud.mogi.vn` với path `images/{năm}/{tháng}/{ngày}/{id}/{hash}.jpg` | Hệ thống lưu trữ ảnh có pipeline upload/resize riêng, tách khỏi app server (dùng CDN/Object storage) |
| PWA-ish meta (`apple-mobile-web-app-capable`, `mobile-web-app-capable`) | Có tối ưu hoá trải nghiệm "Add to Home Screen" trên mobile, không hẳn là PWA đầy đủ (không thấy service worker) |

**Kết luận đề xuất cho dự án mới:** Nếu ưu tiên SEO ngay từ đầu (điều bắt buộc với mô hình rao vặt BĐS), nên chọn kiến trúc **render phía server hoặc SSR/SSG hybrid** thay vì SPA CSR thuần (React/Vue CSR không SSR sẽ yếu về SEO cho hàng chục nghìn trang danh mục).

---

## 7. Phân tích Backend & hạ tầng (suy luận công nghệ)

> ⚠️ Cũng là suy luận kỹ thuật, dựa trên các dấu vết URL/route cụ thể quan sát được.

| Dấu hiệu quan sát được | Suy luận |
|---|---|
| Route `/Account/ForgotPassword` (viết hoa kiểu PascalCase Controller/Action) | Rất đặc trưng của **ASP.NET MVC** (`{Controller}/{Action}` convention) |
| Thư mục `/Content/images/...` (đôi khi viết hoa "Content", đôi khi thường "content" nhưng vẫn resolve — do IIS/Windows không phân biệt hoa-thường) | Củng cố khả năng chạy trên **IIS + ASP.NET (Framework hoặc .NET Core)** |
| `trogiup.mogi.vn` tự khai "Powered by Visual Composer — WordPress" | Xác nhận rõ ràng: **subdomain nội dung/blog chạy WordPress (PHP + MySQL)** độc lập với app chính |
| Nhiều subdomain riêng theo chức năng (`pro.`, `trogiup.`, `cloud.`, `cdn.`, `cdnnews.`) | Kiến trúc **đa dịch vụ (service-oriented)**: 1 app lõi (marketplace), 1 cổng thanh toán/membership riêng, 1 CMS nội dung riêng, các CDN ảnh riêng theo loại nội dung |
| ID dạng số tăng dần cho mọi thực thể (tin `id`, dự án `prj`, user `uid`, khu vực giá `qd`...) | Cơ sở dữ liệu quan hệ (**RDBMS** — khả năng cao SQL Server, đi cùng hệ ASP.NET) với khóa chính auto-increment cho từng bảng thực thể |
| Bộ đếm số tin theo bộ lọc chính xác tới đơn vị ("543.618") cập nhật theo từng khu vực/loại hình | Có tầng **index tìm kiếm** (search index) tách biệt khỏi truy vấn DB thô để trả kết quả đếm + lọc nhanh ở quy mô hàng trăm nghìn–triệu bản ghi — khả năng dùng **Elasticsearch/Solr** hoặc bảng thống kê (materialized count) cập nhật định kỳ |
| Trang giá nhà đất công bố dùng AI phân tích 2 triệu+ tin | Có **pipeline dữ liệu/batch job** (ETL) chạy định kỳ để tổng hợp giá trung bình theo khu vực — tách biệt hệ thống OLTP (giao dịch) khỏi hệ thống phân tích (OLAP/reporting) |
| Xác thực dựa trên SMS OTP | Có tích hợp **SMS Gateway** (nhà cung cấp OTP nội địa VN) |
| Widget vay mua nhà gắn thương hiệu ngân hàng UOB | Có **tích hợp đối tác bên thứ ba** (ngân hàng) qua API/form lead |
| Nút Zalo, TikTok, Youtube, Facebook ở footer | Đa kênh truyền thông xã hội được tích hợp/liên kết ngoài, không phải tính năng lõi platform |

**Kết luận đề xuất cho dự án mới:** Backend không nhất thiết phải sao chép ASP.NET — điều quan trọng là **học theo nguyên lý kiến trúc**: (1) tách app lõi khỏi CMS nội dung, (2) tách lưu trữ ảnh/CDN khỏi app server, (3) có tầng search/index riêng khi dữ liệu tin đăng lớn, (4) có batch job định kỳ cho các tính năng tổng hợp dữ liệu (giá trung bình khu vực), (5) xác thực qua SĐT+OTP là chuẩn thị trường VN.

---

## 8. Mô hình kinh doanh & dòng tiền

| Nguồn thu | Mô tả quan sát được |
|---|---|
| **Phí thành viên (membership)** | Gói theo khu vực + số lượng tin được quản lý cùng lúc, tính theo chu kỳ 30 ngày, có gói dùng thử miễn phí giới hạn (30 ngày/3 tin) |
| **Dịch vụ đẩy tin (TOP-UP/VIP)** | Mua thêm để tin hiển thị ưu tiên/tin được "làm mới" kéo dài thời gian hiển thị 30 ngày kể từ lần làm mới/mua dịch vụ gần nhất |
| **Quảng cáo banner** | Có trang bảng giá "dịch vụ banner quảng cáo trên website" riêng (quan sát từ liên kết liên quan trên trogiup.mogi.vn) |
| **Lead ngân hàng đối tác** | Form "Liên hệ ngân hàng UOB" — khả năng nhận hoa hồng giới thiệu khách vay |
| **Không thu phí người mua/thuê** | Toàn bộ tính năng tìm kiếm, xem tin, liên hệ với người bán đều miễn phí cho bên cầu — chiến lược tối đa hoá lưu lượng bên cầu để tăng giá trị cho bên cung (mô hình marketplace kinh điển) |

---

## 9. Đề xuất Tech Stack cho dự án mới

> Đây là đề xuất **không bắt buộc sao chép công nghệ Mogi** mà chọn stack hiện đại, dễ triển khai, đáp ứng cùng nguyên lý kiến trúc đã phân tích ở trên (SEO-first, tách dịch vụ, có search-index, có CDN ảnh).

### 9.1 Frontend
- **Next.js (React) với App Router** — SSR/SSG/ISR hybrid để vừa SEO tốt (giống nguyên lý server-render của Mogi) vừa có trải nghiệm SPA mượt cho phần dashboard người dùng.
- **TailwindCSS** — dựng nhanh hệ thống card/grid như các trang danh sách tin.
- **React Hook Form + Zod** — cho các form đăng tin, đăng ký, OTP.
- **TanStack Query** — quản lý cache dữ liệu API phía client (dashboard, lưu tin, thông báo).

### 9.2 Backend
- **Node.js (NestJS)** hoặc **Laravel (PHP)** cho app lõi (marketplace API) — cả hai đều mạnh về cấu trúc module hoá tương tự cách Mogi tách domain (Tin đăng, Dự án, Người dùng, Môi giới, Giá khu vực).
- **PostgreSQL** — RDBMS chính cho dữ liệu giao dịch (tin đăng, người dùng, dự án, thanh toán).
- **Elasticsearch (hoặc Meilisearch cho quy mô nhỏ/vừa)** — tầng tìm kiếm/lọc/đếm số lượng tin theo bộ lọc, tách khỏi PostgreSQL để tránh chậm khi dữ liệu lớn.
- **Redis** — cache kết quả tìm kiếm phổ biến, session, rate-limit OTP.
- **BullMQ (Node) / Laravel Queue** — hàng đợi xử lý ảnh (resize/optimize), gửi OTP, batch job tính giá trung bình khu vực định kỳ (giống pipeline AI giá nhà đất của Mogi, có thể bắt đầu bằng công thức thống kê trung bình/trung vị trước khi đầu tư ML).

### 9.3 Nội dung / Blog
- **WordPress headless (chỉ dùng làm CMS, lấy dữ liệu qua REST/GraphQL API) hoặc CMS hiện đại (Strapi/Sanity)** cho phần tin tức/trợ giúp — noi theo đúng nguyên lý Mogi: **tách content khỏi app lõi**.

### 9.4 Lưu trữ & CDN
- **Object storage (S3-compatible: AWS S3 / Cloudflare R2 / DigitalOcean Spaces)** cho ảnh tin đăng, ảnh dự án, avatar — kèm CDN (CloudFront/Cloudflare) — mô phỏng vai trò `cloud.mogi.vn`.

### 9.5 Xác thực & bên thứ ba
- **SMS OTP** qua nhà cung cấp trong nước (VD: eSMS, Speed SMS, Twilio nếu cần quốc tế) + **Google OAuth**.
- **Payment gateway nội địa** (VNPay/Momo/ZaloPay) cho phí thành viên/dịch vụ đẩy tin.
- **Google Tag Manager + Google Analytics 4** cho tracking, giống Mogi.

### 9.6 Hạ tầng & DevOps
- **Docker + CI/CD (GitHub Actions)**.
- **Reverse proxy/CDN**: Cloudflare (cache trang tĩnh, chống bot cào dữ liệu số điện thoại).
- **Sitemap.xml tự sinh định kỳ** cho hàng chục nghìn trang danh mục (bắt buộc với mô hình programmatic SEO).

---

## 10. Kiến trúc hệ thống tổng thể (đề xuất)

```
                         ┌─────────────────────┐
                         │   Cloudflare CDN/WAF  │
                         └──────────┬───────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
┌───────▼────────┐        ┌─────────▼─────────┐        ┌────────▼────────┐
│  Web App        │        │  CMS Blog/Trợ giúp │        │  Object Storage  │
│  (Next.js SSR)  │        │  (WordPress/Strapi)│        │  (S3 + CDN ảnh)  │
└───────┬────────┘        └─────────┬─────────┘        └─────────────────┘
        │  REST/GraphQL              │  REST/GraphQL
        │                            │
┌───────▼─────────────────────────────▼───────┐
│           API Gateway / Backend (NestJS)      │
│  Modules: Listing | User | Broker | Project   │
│  | PriceIndex | Membership | Notification     │
└───────┬─────────────┬─────────────┬──────────┘
        │             │             │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐   ┌──────────────┐
│ PostgreSQL    │ │Elasticsearch│ │  Redis    │   │  Queue Worker │
│ (nguồn sự thật)│ │(tìm kiếm/lọc)│ │(cache/OTP)│   │(BullMQ: ảnh,  │
└───────────────┘ └────────────┘ └───────────┘   │ OTP, batch giá)│
                                                    └───────┬───────┘
                                          ┌─────────────────┼─────────────────┐
                                          │                 │                 │
                                   ┌──────▼─────┐   ┌───────▼──────┐  ┌───────▼──────┐
                                   │ SMS Gateway │   │ Payment GW    │  │ Bank Partner │
                                   │ (OTP)       │   │ (VNPay/Momo)  │  │ API (vay nhà)│
                                   └────────────┘   └──────────────┘  └──────────────┘
```

**Nguyên tắc thiết kế rút ra từ Mogi và áp dụng ở đây:**
1. Tách **app giao dịch (lõi)** khỏi **CMS nội dung** — 2 đội có thể phát triển độc lập.
2. Tách **lưu trữ ảnh/CDN** khỏi app server để giảm tải và tăng tốc độ load.
3. Có **tầng search riêng** (Elasticsearch) khi số lượng tin đăng vượt ngưỡng vài chục nghìn — PostgreSQL đơn thuần sẽ chậm khi lọc đa điều kiện (khu vực + giá + diện tích + loại hình) trên hàng trăm nghìn bản ghi.
4. Có **hàng đợi (queue)** cho các tác vụ nặng/không đồng bộ: resize ảnh, gửi OTP, tính lại chỉ số giá trung bình khu vực.
5. Có **batch job định kỳ** phục vụ tính năng "Giá nhà đất" — không tính real-time mỗi lần người dùng xem mà cache/tổng hợp trước.

---

## 11. Thiết kế cơ sở dữ liệu (đề xuất)

Lược đồ rút gọn — phản ánh các thực thể quan sát được từ URL pattern của Mogi (`id`, `prj`, `uid`, `qd`, `cid`, `wid`, `sid`):

```sql
-- Người dùng / Môi giới
users (
  id BIGSERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  full_name VARCHAR(150),
  password_hash TEXT,
  avatar_url TEXT,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_id_verified BOOLEAN DEFAULT FALSE,     -- "Đã xác thực CMND"
  google_id VARCHAR(100) NULL,
  role VARCHAR(20) DEFAULT 'user',          -- user | broker | admin
  created_at TIMESTAMP DEFAULT now()
);

-- Địa giới hành chính (province/district/ward/street) — dùng chung cho URL slug
locations (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES locations(id),
  level VARCHAR(20),          -- province | district | ward | street
  name VARCHAR(150),
  slug VARCHAR(150) UNIQUE,
  code_prefix VARCHAR(5)      -- tương ứng qd/cid/wid/sid trong URL Mogi
);

-- Dự án BĐS
projects (
  id BIGSERIAL PRIMARY KEY,   -- tương ứng prj{ID}
  name VARCHAR(200),
  slug VARCHAR(220) UNIQUE,
  developer_name VARCHAR(200),
  location_id INT REFERENCES locations(id),
  handover_year SMALLINT,
  price_from BIGINT,
  price_per_m2_min INT,
  price_per_m2_max INT,
  thumbnail_url TEXT,
  description TEXT
);

-- Tin đăng bất động sản
listings (
  id BIGSERIAL PRIMARY KEY,   -- tương ứng id{ID}
  owner_id BIGINT REFERENCES users(id),
  project_id BIGINT NULL REFERENCES projects(id),
  location_id INT REFERENCES locations(id),
  transaction_type VARCHAR(10),   -- sale | rent
  property_type VARCHAR(30),      -- nha | can-ho | dat | mat-bang | phong-tro ...
  title VARCHAR(250),
  slug VARCHAR(280),
  description TEXT,
  price BIGINT,
  area_m2 DECIMAL(10,2),
  bedrooms SMALLINT,
  bathrooms SMALLINT,
  legal_status VARCHAR(50),       -- Sổ hồng | Sổ đỏ | Đang chờ sổ ...
  address_detail TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | active | expired | rejected | removed
  published_at TIMESTAMP,
  expires_at TIMESTAMP,
  refreshed_at TIMESTAMP,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

listing_images (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT REFERENCES listings(id) ON DELETE CASCADE,
  image_url TEXT,
  sort_order SMALLINT
);

-- Lưu tin / Tìm kiếm đã lưu
saved_listings (
  user_id BIGINT REFERENCES users(id),
  listing_id BIGINT REFERENCES listings(id),
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

saved_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  filters JSONB,               -- lưu bộ lọc dạng JSON
  notify_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

-- Chỉ số giá theo khu vực (batch job cập nhật định kỳ)
price_index (
  id SERIAL PRIMARY KEY,
  location_id INT REFERENCES locations(id),
  period DATE,                 -- tháng thống kê
  avg_price_per_m2 BIGINT,
  change_percent DECIMAL(5,2),
  sample_size INT,
  UNIQUE(location_id, period)
);

-- Gói thành viên & giao dịch
membership_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  region_scope VARCHAR(50),
  max_active_listings INT,
  duration_days INT DEFAULT 30,
  price BIGINT
);

user_memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  plan_id INT REFERENCES membership_plans(id),
  started_at TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR(20)
);

listing_boosts (           -- dịch vụ đẩy tin / TOP-UP / VIP
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT REFERENCES listings(id),
  boost_type VARCHAR(20),  -- vip | top-up | refresh
  starts_at TIMESTAMP,
  ends_at TIMESTAMP
);

-- Report vi phạm
listing_reports (
  id BIGSERIAL PRIMARY KEY,
  listing_id BIGINT REFERENCES listings(id),
  reporter_id BIGINT REFERENCES users(id) NULL,
  reason VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

**Ghi chú thiết kế:** `filters JSONB` trong `saved_searches` giúp linh hoạt lưu bất kỳ tổ hợp bộ lọc nào (khu vực, giá, diện tích, loại hình...) mà không cần thay đổi schema mỗi khi thêm bộ lọc mới — nguyên lý áp dụng phổ biến cho các hệ thống lọc phức tạp tương tự Mogi.

---

## 12. Cấu trúc thư mục dự án (đề xuất)

```
project-root/
├── apps/
│   ├── web/                      # Next.js — frontend công khai (SSR)
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── [province]/[action]/page.tsx      # trang danh sách theo khu vực
│   │   │   │   ├── [province]/[district]/[slug]-id[id]/page.tsx  # chi tiết tin
│   │   │   │   ├── du-an/[slug]-prj[id]/page.tsx
│   │   │   │   ├── gia-nha-dat/page.tsx
│   │   │   │   ├── tim-moi-gioi/page.tsx
│   │   │   ├── (auth)/dang-nhap/page.tsx
│   │   │   ├── (dashboard)/trang-ca-nhan/...
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── listing-card/
│   │   │   ├── search-bar/
│   │   │   ├── auth-modal/
│   │   │   ├── loan-calculator-widget/
│   │   │   └── layout/(header, footer)
│   │   └── lib/api-client.ts
│   ├── api/                      # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── listings/
│   │   │   │   ├── users/
│   │   │   │   ├── brokers/
│   │   │   │   ├── projects/
│   │   │   │   ├── price-index/
│   │   │   │   ├── membership/
│   │   │   │   ├── search/          # tích hợp Elasticsearch
│   │   │   │   ├── notifications/
│   │   │   │   └── auth/            # OTP, Google OAuth, JWT
│   │   │   └── main.ts
│   ├── cms/                      # WordPress/Strapi cho blog + trợ giúp
│   └── worker/                   # BullMQ worker: ảnh, OTP, batch giá
├── packages/
│   ├── ui/                       # shared component (nếu cần dùng chung cho admin)
│   ├── types/                    # TypeScript type dùng chung FE/BE
│   └── utils/
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/
│   └── ci-cd/ (GitHub Actions)
└── docs/
    ├── README.md                 # (chính là file này)
    ├── api-spec.yaml             # OpenAPI spec
    └── db-schema.sql
```

---

## 13. Danh mục API cần xây dựng

| Nhóm | Endpoint mẫu | Mô tả |
|---|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/otp/send`, `POST /auth/otp/verify`, `POST /auth/login`, `POST /auth/google`, `POST /auth/forgot-password` | Toàn bộ luồng đăng ký/đăng nhập giống Mogi (SĐT+OTP, Google) |
| **Listings** | `GET /listings?province=&district=&type=&priceMin=&priceMax=&areaMin=&areaMax=&page=`, `GET /listings/:id`, `POST /listings`, `PUT /listings/:id`, `DELETE /listings/:id`, `POST /listings/:id/refresh`, `POST /listings/:id/report` | CRUD tin đăng + lọc đa điều kiện + làm mới + report |
| **Projects** | `GET /projects`, `GET /projects/:slug`, `GET /projects/:id/listings` | Dự án + tin thuộc dự án |
| **Brokers** | `GET /brokers?province=`, `GET /brokers/:id`, `GET /brokers/:id/listings` | Danh bạ môi giới |
| **Price Index** | `GET /price-index?region=`, `GET /price-index/:locationId/history` | Bảng giá + biểu đồ lịch sử |
| **User Dashboard** | `GET /me/listings`, `GET /me/saved-listings`, `POST /me/saved-listings/:listingId`, `GET /me/saved-searches`, `POST /me/saved-searches`, `GET /me/notifications` | Khu vực cá nhân |
| **Membership** | `GET /membership/plans`, `POST /membership/subscribe`, `GET /me/membership` | Gói thành viên |
| **Payment** | `POST /payment/checkout`, `POST /payment/webhook` | Cổng thanh toán (VNPay/Momo) |
| **Loan Tool** | `POST /loan/estimate` (tính phía client cũng được), `POST /loan/contact-bank` | Ước tính vay + gửi lead ngân hàng |
| **Search (internal)** | Đồng bộ dữ liệu `listings` → Elasticsearch qua event/queue khi tạo/sửa/xoá tin | Không public trực tiếp, dùng nội bộ cho `GET /listings` |
| **Admin** | `GET /admin/listings/pending`, `POST /admin/listings/:id/approve`, `POST /admin/listings/:id/reject`, `GET /admin/reports` | Kiểm duyệt tin, xử lý report |

---

## 14. Danh mục trang / component cần xây dựng

**Trang công khai:**
- Trang chủ (Hero search + tab Mua/Thuê/Giá + khối tiện ích + khối SEO khu vực)
- Trang danh sách/kết quả tìm kiếm (theo mọi tổ hợp khu vực × loại hình × giao dịch)
- Trang chi tiết tin đăng
- Trang danh sách dự án + trang chi tiết dự án
- Trang giá nhà đất (bảng + chi tiết khu vực có biểu đồ)
- Trang danh bạ môi giới + trang hồ sơ môi giới
- Trang blog/tin tức + trang bài viết
- Trang tĩnh: Giới thiệu, Điều khoản, Liên hệ, Bảng giá dịch vụ

**Trang yêu cầu đăng nhập:**
- Đăng tin mới / Sửa tin
- Quản lý tin đã đăng (danh sách + trạng thái + hành động làm mới/xoá/đẩy tin)
- Thông tin tài khoản / Đổi mật khẩu
- BĐS đã lưu / Tìm kiếm đã lưu
- Thông báo
- Mua/gia hạn gói thành viên

**Component dùng chung:**
- Header (2 trạng thái: guest/logged-in) + Footer 5 cột
- Listing Card (grid/list view)
- Search Filter Bar (khu vực, loại hình, giá, diện tích, PN/WC...)
- Auth Modal (đăng nhập/đăng ký/OTP/quên mật khẩu — nhiều bước trong 1 modal)
- Image Gallery/Lightbox
- Pagination
- Loan Calculator Widget
- Broker Info Card
- Breadcrumb
- Toast/Notification

---

## 15. Roadmap triển khai theo giai đoạn

**Giai đoạn 1 — MVP lõi (6–8 tuần)**
- Auth (SĐT+OTP, Google), CRUD tin đăng cơ bản, upload ảnh (S3), trang danh sách + chi tiết tin, tìm kiếm/lọc cơ bản trên PostgreSQL (chưa cần Elasticsearch nếu dữ liệu còn ít), trang cá nhân cơ bản (quản lý tin, lưu tin).

**Giai đoạn 2 — SEO & mở rộng nội dung (4–6 tuần)**
- Sinh trang danh mục theo tổ hợp khu vực/loại hình tự động, sitemap.xml tự sinh, tích hợp GTM/GA4, thiết lập CMS blog (WordPress/Strapi) và trang tin tức, viết nội dung content pillar theo khu vực.

**Giai đoạn 3 — Marketplace hoá & kiếm tiền (4–6 tuần)**
- Module Dự án, module Môi giới/danh bạ, gói thành viên + thanh toán (VNPay/Momo), dịch vụ đẩy tin/VIP/TOP-UP, trang giá nhà đất (batch job tính trung bình khu vực).

**Giai đoạn 4 — Mở rộng quy mô (song song/liên tục)**
- Tích hợp Elasticsearch khi số tin tăng cao, cache Redis cho các truy vấn phổ biến, hệ thống report/kiểm duyệt + trang quản trị (admin panel), widget vay mua nhà + tích hợp đối tác ngân hàng, tính năng tra cứu/ tiện ích ngách (review khu vực, phòng trọ gần trường...).

**Giai đoạn 5 — Tối ưu & AI (dài hạn)**
- Mô hình định giá tự động (ML) dựa trên lịch sử tin đăng, gợi ý cá nhân hoá (recommendation), chatbot hỗ trợ tìm kiếm.

---

## 16. Checklist đối chiếu tính năng với Mogi.vn

- [x] Tìm kiếm/lọc theo khu vực (tỉnh → quận/huyện → phường) + loại hình + giao dịch (mua/thuê) — *đã có SearchFilterBar trên /mua-ban và /thue*
- [x] Trang chi tiết tin với gallery ảnh, thông tin chính, mô tả, thông tin người đăng
- [x] Ẩn số điện thoại, yêu cầu đăng nhập để xem/liên hệ (content gating) — *đã có PhoneRevealLog + chống spam số liệu*
- [x] Đăng ký/đăng nhập bằng SĐT + OTP, quên mật khẩu (Google OAuth theo lộ trình giai đoạn sau)
- [x] Đăng tin, quản lý tin (gỡ tin/xoá, theo dõi trạng thái, upload nhiều ảnh thật)
- [x] Lưu tin yêu thích (SavedListing, nút Lưu tin trang chi tiết, dashboard BĐS đã lưu thật)
- [ ] Module Dự án bất động sản (liên kết tới các tin thuộc dự án) — *đang ở dạng trang chờ trung thực*
- [ ] Module Môi giới/danh bạ (hồ sơ, xác thực, danh sách tin đang đăng) — *đang ở dạng trang chờ trung thực*
- [ ] Trang giá nhà đất theo khu vực (bảng + biểu đồ lịch sử) — *đang ở dạng trang chờ trung thực*
- [ ] Gói thành viên trả phí + dịch vụ đẩy tin/VIP
- [ ] Blog/tin tức bất động sản (CMS tách biệt)
- [x] Report vi phạm tin đăng (ReportListingModal gửi báo cáo thật tới backend)
- [x] Công cụ ước tính chi phí dọn vào tháng đầu (MoveInCostEstimator trên trang chi tiết)
- [x] SEO: meta động, sitemap, breadcrumb, robots.ts trên toàn bộ 26+ routes
- [x] Đa kênh liên hệ (Hotline/Zalo 0981 753 082, email, trang /lien-he)
- [x] Trang Admin quản trị UI thuần 100% tiếng Việt (/admin, /admin/tin-cho-duyet, /admin/bao-cao-vi-pham, /admin/nguoi-dung)
- [x] Trang Pháp lý & Độ tin cậy (/dieu-khoan, /chinh-sach, /gioi-thieu, /lien-he)
- [x] Tác vụ nền định kỳ tự động chuyển tin hết hạn & dọn OTP (TasksService)
- [x] Ghi log lỗi có cấu trúc (Structured Logging với NestJS Logger trong HttpExceptionFilter)

---

## 17. Rủi ro, giới hạn & khuyến nghị

1. **Giới hạn của tài liệu này**: các kết luận về công nghệ backend (ASP.NET/SQL Server...) là **suy luận** từ dấu vết bên ngoài (route pattern, thẻ meta), **không phải xác nhận chính thức**. Khi triển khai dự án riêng, không cần và không nên cố sao chép đúng công nghệ Mogi — hãy chọn stack đội ngũ bạn thành thạo nhất, miễn giữ đúng **nguyên lý kiến trúc** đã rút ra (tách dịch vụ, SEO-first, có tầng search khi dữ liệu lớn).
2. **Bản quyền nội dung**: Không sao chép nguyên văn nội dung/văn bản/hình ảnh của Mogi.vn khi xây dựng site mới — tài liệu này chỉ nên dùng để tham khảo **cấu trúc, luồng chức năng, mô hình dữ liệu**, không dùng để nhân bản nội dung có bản quyền.
3. **Pháp lý ngành BĐS Việt Nam**: cần có trang Điều khoản sử dụng, Chính sách bảo mật, thông tin công ty chịu trách nhiệm nội dung, và nếu hoạt động như sàn giao dịch bất động sản/kinh doanh dịch vụ môi giới cần tuân thủ quy định liên quan (Luật Kinh doanh bất động sản, quy định về thông báo website TMĐT/cung cấp dịch vụ trực tuyến với Bộ Công Thương nếu áp dụng).
4. **Ưu tiên kỹ thuật khi mới bắt đầu**: đừng xây tầng Elasticsearch/AI định giá ngay từ ngày đầu nếu chưa có dữ liệu — nguyên lý "start simple, scale khi cần" quan trọng hơn việc sao chép đầy đủ kiến trúc của một sàn đã vận hành nhiều năm với hàng triệu tin đăng.
5. **Chống spam/bot cào dữ liệu**: cơ chế ẩn số điện thoại sau đăng nhập + OTP xác thực thật là hàng rào hiệu quả nên áp dụng ngay từ đầu, tránh để lộ dữ liệu liên hệ công khai gây spam cho người dùng.

---

*Tài liệu được biên soạn dựa trên khảo sát trực tiếp mogi.vn (08/2026) để phục vụ mục đích tham khảo kiến trúc, không đại diện cho quan điểm hay xác nhận chính thức từ Mogi.vn/Công ty Cổ phần Định Anh.*

# CLAUDE.md — Đặc tả dự án Nền tảng Bất Động Sản (tham chiếu Mogi.vn)

> Tài liệu này là "bộ não" của dự án — Claude (và bất kỳ dev nào) đọc file này trước khi code bất cứ thứ gì.
> Phần 1 là **phân tích thực tế** website tham chiếu (mogi.vn, truy cập trực tiếp ngày 30/08/2026).
> Phần 2 trở đi là **đặc tả kiến trúc đề xuất** cho dự án mới, được suy ra từ phần 1 nhưng điều chỉnh theo hướng gọn nhẹ, dễ triển khai, dễ maintain một mình.
>
> **Định hướng chiến lược (Kế hoạch điều chỉnh V2 — 25/09/2026):** Dự án chính thức vận hành theo đặc tả [`docs/audit/ke-hoach-dieu-chinh-batdongsan-2026-09-25.md`](./docs/audit/ke-hoach-dieu-chinh-batdongsan-2026-09-25.md) (V2 thay thế hoàn toàn V1).
> Mô hình: Môi giới cho thuê chuyên biệt có người thật (Đức Quân) làm đầu mối duy nhất, thu phí thành công từ chủ nhà bằng **40% tiền thuê trung bình một tháng theo toàn bộ thời hạn hợp đồng đã xác định** (bình quân có trọng số toàn kỳ hợp đồng $\Sigma(p_i \times m_i) / \Sigma(m_i) \times 40\%$, thu một lần khi giao dịch đủ điều kiện thành công: đã ký HĐ thuê + đã thanh toán kỳ đầu đến hạn nếu có + đã bàn giao phòng), **khách thuê miễn phí 100%** (không cần tài khoản, gửi form xem phòng trực tiếp).
> Quyết định này THAY THẾ mọi tài liệu trước đó nói về mô hình marketplace 2 chiều tự liên hệ hoặc gói membership/đăng tin làm nguồn thu chính.
> Nền tảng kết nối người thuê qua đầu mối tư vấn và trực tiếp dẫn xem của Quân; tên và số điện thoại công khai trên mọi tin là của Quân, không để lộ số riêng của chủ ra ngoài. Chủ ký hợp đồng thuê trực tiếp với khách; nền tảng **KHÔNG giữ cọc, KHÔNG thu hộ tiền thuê**.
> **Tuyệt đối không có chức năng thanh toán trực tuyến trên website** (không checkout, không VietQR, không webhook ngân hàng tự động). Vô hiệu hóa route VietQR và webhook bank trả 404 nhất quán (BR-01, GAP-06). Quản lý hợp đồng dịch vụ HĐ-01 với chủ và sổ công nợ phí môi giới nội bộ.
>
> Tham khảo Mogi.vn ở Phần 1 để kế thừa kinh nghiệm kiến trúc và SEO, nhưng đặc tả kỹ thuật từ Phần 2 đã được chuẩn hóa 100% cho mô hình cho thuê.

---

## PHẦN 1 — PHÂN TÍCH TOÀN DIỆN MOGI.VN

### 1.1 Tổng quan doanh nghiệp
- **Chủ sở hữu pháp lý:** Công ty Cổ phần Định Anh, GP số 429/GP-BTTTT (11/10/2019).
- **Hệ sinh thái:** Mogi nằm trong cùng tập đoàn với **Muaban.net** (rao vặt tổng hợp) và **Vieclam.net** (việc làm) — dùng chung hạ tầng AI định giá ("khảo sát 2.000.000 tin từ Mogi + Muaban.net").
- **Mô hình kinh doanh:** Marketplace 2 chiều miễn phí cho người tìm mua/thuê, **thu phí người đăng tin (môi giới/chủ nhà)** qua gói thành viên + dịch vụ đẩy tin (giống mô hình Chợ Tốt, Batdongsan.com.vn).
- **Domain phụ tách biệt theo chức năng** (dấu hiệu kiến trúc microservice/multi-app rõ rệt):
  | Subdomain | Vai trò | Công nghệ suy đoán |
  |---|---|---|
  | `mogi.vn` | App chính: tìm kiếm, tin đăng, tài khoản | ASP.NET MVC (thấy route `/Account/Login`, `/Account/ForgotPassword`, `/logoff` — pattern kinh điển của ASP.NET Identity) |
  | `pro.mogi.vn` | Trang bán gói thành viên cho môi giới (B2B) | Redirect qua chung hệ Account của mogi.vn |
  | `cloud.mogi.vn` | CDN ảnh tin đăng (`/images/2026/08/16/...`) | Object storage kiểu S3, tổ chức theo năm/tháng/ngày/user-shard |
  | `cdn.mogi.vn` | CDN banner quảng cáo | Object storage |
  | `cdnnews.mogi.vn` | CDN ảnh bài viết tin tức | WordPress `wp-content/uploads` pattern |
  | `trogiup.mogi.vn` | Trung tâm trợ giúp, bảng giá, chính sách, blog PR | **WordPress** (thấy "Visual Composer", `wp-content`, tác giả bài viết) |
  | `mogi.vn/news/` | Tin tức BĐS (content marketing/SEO) | Route dạng `/news/tieu-de-slug-123456/` — có thể là module riêng trong app chính, không phải WordPress |

**→ Bài học kiến trúc:** tách app lõi (giao dịch, tài khoản) khỏi app nội dung (blog/help) là hợp lý — WordPress cho content, custom app cho phần lõi. Không cần bắt chước y hệt nhưng nên tách **CMS nội dung** ra khỏi **core marketplace** ngay từ đầu để dễ scale đội content riêng.

### 1.2 Bản đồ điều hướng (Sitemap chính)
```
/ (Trang chủ)
├── /mua-nha-dat, /thue-nha-dat          → Trang tìm kiếm gốc (toàn quốc)
├── /gia-nha-dat                          → Bảng giá nhà đất AI (theo quận/tháng)
├── /tim-moi-gioi                         → Danh bạ môi giới
├── /du-an                                → Danh sách dự án BĐS (chủ đầu tư)
├── /review-khu-vuc                       → Đánh giá khu vực sống (theo phường)
├── /tra-cuu-sau-sap-nhap  [NEW]          → Tra cứu địa giới hành chính sau sáp nhập tỉnh/thành
├── /10-buoc-mua-nha, /vay-mua-nha        → Content hướng dẫn (funnel dẫn dắt)
├── /phong-tro-gan-truong, /phong-tro-gan-kcn → Landing page ngách (SEO long-tail)
├── /dang-nhap, /dang-tin                 → Auth & đăng tin (yêu cầu login)
├── /trang-ca-nhan/*                      → Khu vực tài khoản cá nhân
├── /news/*                               → Tin tức BĐS
└── /lien-he                              → Liên hệ

// Pattern URL SEO-first (không dùng query string cho filter chính):
/{tỉnh-thành}/{loại-tin}                                    vd: /ho-chi-minh/mua-nha-dat
/{tỉnh-thành}/{quận}/{loại-tin}                              vd: /ho-chi-minh/quan-7/mua-can-ho
/{quận}/{loại-hình}/{tiêu-đề-slug}-id{propertyId}            vd: /quan-10/mua-can-ho-chung-cu/ban-can-...-id21521153
/moi-gioi/{sđt}-{tên-slug}-uid{brokerId}
/{tên-dự-án}-prj{projectId}
/gia-nha-dat-{quận}-qd{regionId}
/tim-moi-gioi/{tỉnh}-cid{cityId}
?cp={số}                                                      → duy nhất query-string dùng cho phân trang
```
**Nhận xét quan trọng:** Mogi **không dùng query string cho filter chính** (giá, diện tích, loại nhà) mà encode luôn vào path (`/mua-nha`, `/mua-can-ho`, `/mua-dat`...) — đây là kỹ thuật SEO cố ý để mỗi tổ hợp lọc phổ biến (tỉnh × quận × loại hình) trở thành 1 URL index được, ra hàng trăm nghìn landing page tự động. ID tin đăng gắn hậu tố `-id{number}` vào cuối slug để vừa đẹp URL vừa unique.

### 1.3 Cấu trúc trang chủ (Frontend)
1. **Header sticky 2 tầng:**
   - Tầng 1: logo + menu ngang (Tìm mua / Tìm thuê / Giá nhà đất / Phí thành viên / Môi giới / Dự án / badge "New" cho tính năng mới) + nút Đăng nhập/Đăng ký.
   - Khi đã login: đổi thành avatar dropdown (Quản lý tin, Thông tin tài khoản, Thông báo, BĐS đã lưu, Tìm kiếm đã lưu, Đổi mật khẩu, Thoát) + nút CTA nổi bật "Đăng tin mới".
2. **Hero section:** headline cảm xúc ("An tâm chọn, An tâm mua") + thanh search lớn với 2 tab Mua/Thuê + ô nhập địa điểm/từ khóa (autocomplete JS, không lấy được qua fetch tĩnh).
3. **Khối "Tiện ích từ Mogi.vn":** shortcut ngang tới các tính năng phụ (Review khu vực, Phòng trọ gần trường, Phòng trọ công nhân, 10 bước mua nhà, Vay mua nhà) — dùng để tăng thời gian on-site và internal link SEO.
4. **Mega-menu SEO footer-style ngay giữa trang** (không đợi cuộn xuống footer): 6 khối link cứng theo khu vực nổi bật (TPHCM, Hà Nội, Mua bán, Cho thuê, Về Mogi, Đối tác, Công cụ, Dịch vụ) — đây là **internal linking layer** khổng lồ, mỗi khối 5-6 anchor text chứa từ khóa.
5. **Footer:** logo + hotline 2 miền + email (ẩn dạng Cloudflare email-protection để chặn bot scrape) + social (Facebook/YouTube/Zalo/TikTok) + thông tin pháp lý công ty + badge Bộ Công Thương + DMCA.

### 1.4 Trang danh sách/tìm kiếm (Listing/Search Results Page)
- Breadcrumb (Mogi › Loại tin › Khu vực).
- H1 động chèn tháng/năm hiện tại để luôn "tươi" với Google (`...Mới Nhất T8/2026`).
- Đếm tổng kết quả nổi bật ("1-15 trong 543.618").
- **Card tin đăng** gồm: ảnh đại diện + badge số lượng ảnh (icon "7 ảnh"), tiêu đề (link), địa chỉ rút gọn, 3 thuộc tính nhanh (diện tích/PN/WC dạng icon), giá (định dạng "X tỷ Y triệu" thay vì số thô), nhãn thời gian đăng ("Hôm nay").
- Phân trang dạng số trang cổ điển (?cp=N), không infinite scroll.
- **Khối nội dung SEO ~1500-2500 từ nằm ngay dưới danh sách kết quả** (giới thiệu khu vực, bảng giá tham khảo, FAQ dạng H3 câu hỏi) — lặp lại 1 khuôn mẫu cho mọi trang tỉnh/quận, chỉ thay biến số liệu. Đây là chiến lược **programmatic SEO** cốt lõi của Mogi.
- Cuối trang: khối "Loại bất động sản" + "Khu vực" dạng chip kèm số lượng tin (Nhà (526.561), Căn hộ (94.475)...) — vừa là filter nhanh vừa là internal link.

### 1.5 Trang chi tiết tin đăng (Property Detail Page) — trang quan trọng nhất
Thứ tự bố cục từ trên xuống:
1. Breadcrumb đầy đủ 4 cấp (Mogi › Loại › Tỉnh › Quận) + tiêu đề tin cuối breadcrumb (không phải link).
2. Link "Về danh sách" / "Tin tiếp" (điều hướng prev/next trong list — giữ context tìm kiếm).
3. **Gallery ảnh** (ảnh đầu full-width, các ảnh sau dạng thumbnail — lazy load).
4. Tiêu đề (H1) + địa chỉ đầy đủ + **giá nổi bật** + nút "Lưu tin" (yêu cầu login).
5. **Bảng "Thông tin chính"** dạng grid 2 cột: Diện tích sử dụng, Diện tích đất (kèm cạnh AxB), Phòng ngủ, Nhà tắm, **Pháp lý** (Sổ hồng/Sổ đỏ/Hợp đồng...), Ngày đăng, **Mã BĐS** (ID duy nhất, dùng để tra cứu/report).
6. Mô tả chi tiết (textarea người dùng nhập, giữ nguyên xuống dòng).
7. Nút "Báo vi phạm" (trust & safety, cho phép cộng đồng report tin rác/lừa đảo).
8. **Card người đăng tin:** avatar mặc định, tên (link tới trang cá nhân môi giới `/moi-gioi/...`), "Đã tham gia: X ngày/năm".
9. Khối "Có thể bạn muốn xem" — internal link tới các trang list liên quan (theo tỉnh, quận, phường, đường).
10. "Tiện ích xung quanh" — khu vực gắn bản đồ + POI (trường học, bệnh viện, chợ) quanh vị trí BĐS.
11. **Sticky contact box** (thường cố định khi cuộn): avatar + tên môi giới + số điện thoại **ẩn dưới dạng "Bấm để hiện số"** (chống scrape số & đo lường lượt quan tâm thực) + nút "Gửi tin nhắn" + banner đối tác ngân hàng (UOB) "Vay mua nhà".
12. **Modal tính năng — rất đáng học:**
    - Modal đăng nhập/đăng ký **all-in-one dùng OTP số điện thoại** (không cần email): nhập SĐT → nhập mật khẩu (nếu tài khoản cũ) hoặc tạo mật khẩu mới (tài khoản mới) → xác thực OTP 4-6 số có đếm ngược "Gửi lại mã sau Ns". Có thêm lựa chọn "Đăng nhập với Google".
    - Modal "Ước tính khoản vay": form Giá trị nhà / Thời hạn / % trả trước / Lãi suất → tính ra khoản trả hàng tháng (client-side calculator, tăng time-on-page + lead gen cho ngân hàng đối tác).
    - Modal "Liên hệ ngân hàng UOB": Họ tên/Điện thoại/Email → lead cho đối tác tài chính (đây là **nguồn doanh thu phụ** ngoài phí đăng tin: affiliate/lead-gen cho bank).

### 1.6 Trang môi giới (`/tim-moi-gioi`)
- Danh sách card: avatar, tên, badge "Đã xác thực CMND" (trust signal), thời gian tham gia, SĐT, số lượng tin đang đăng, danh sách khu vực hoạt động (chip).
- Trang cá nhân môi giới (`/moi-gioi/{sđt}-{tên}-uid{id}`) tổng hợp toàn bộ tin đang đăng của người đó — **giống trang shop trong TMĐT**.
- Filter theo tỉnh/thành (`cid`).

### 1.7 Trang Dự án (`/du-an`)
- Card dự án: ảnh, tên dự án, **tên chủ đầu tư**, khu vực + năm bàn giao, giá khởi điểm + đơn giá/m², 2 nút trạng thái ("Đang bán" / "Cho thuê") dẫn tới listing lọc theo `prj{id}`, kèm bài viết tin tức liên quan tới dự án đó.
- Đây là **entity riêng biệt** (Project) không phải Listing — nhiều tin đăng (Listing) có thể thuộc về 1 Project.

### 1.8 Trang Giá nhà đất (`/gia-nha-dat`) — tính năng AI/data nổi bật nhất
- Bảng giá trung bình theo quận/huyện, có % tăng/giảm so với kỳ trước (mũi tên ▲▼), link sang trang chi tiết giá theo từng quận (`qd{id}`).
- Tự nhận là dùng AI khảo sát 2 triệu tin đăng để định giá — thực chất là **thống kê giá/m² trung bình có trọng số theo lịch sử tin đăng đã đăng + đã bán**, kết hợp so sánh khu vực lân cận. Đây là tính năng giữ chân người dùng quay lại hàng tháng (giống "Zestimate" của Zillow).

### 1.9 Trang Review khu vực (`/review-khu-vuc`)
- Chọn tỉnh → chọn phường → trang review tổng hợp tiện ích (trường học, bệnh viện, TTTM) kèm video giới thiệu YouTube nhúng + link tới tin đăng & môi giới khu vực đó. Mục tiêu: giữ chân người dùng đang trong giai đoạn "nghiên cứu" trước khi quyết định mua.

### 1.10 Luồng xác thực & đăng tin (Auth & Posting Flow)
```
Khách vãng lai xem được: trang chủ, list, chi tiết tin (trừ SĐT bị ẩn), giá nhà đất, review khu vực, tin tức
    ↓ (bấm "Bấm để hiện số" / "Lưu tin" / "Đăng tin mới")
Bắt buộc đăng nhập → Modal OTP (SĐT + mật khẩu, hoặc SĐT mới → tạo mật khẩu → xác thực OTP)
    ↓
Đã đăng nhập → /dang-tin (wizard nhiều bước: chọn loại hình → nhập địa chỉ → thông tin diện tích/phòng/pháp lý
                → upload ảnh → mô tả → chọn gói hiển thị (thường/VIP) → thanh toán nếu cần → chờ duyệt)
    ↓
/trang-ca-nhan/quan-ly-tin → dashboard quản lý tin đã đăng (còn hạn/hết hạn/chờ duyệt), gia hạn, đẩy tin (TOP-UP)
```
- **Toàn bộ route quản trị cá nhân dùng path `/Account/*` viết hoa kiểu MVC** (`/Account/Login`, `/Account/ForgotPassword`) trong khi route công khai dùng tiếng Việt không dấu thường — dấu hiệu route công khai được custom routing riêng còn phần Identity dùng mặc định của framework.

### 1.11 Mô hình kiếm tiền (Monetization) — suy ra từ `pro.mogi.vn` + bảng giá
- **Gói thành viên (subscription) theo khu vực + số lượng tin quản lý**, đơn vị tính theo tháng (30 ngày), có gói **Trial miễn phí 30 ngày/3 tin** để onboarding.
- Mua thêm khu vực thứ 2 phải cùng hạng gói + cùng số tin (tránh combo lệch giá).
- **Dịch vụ tin trả phí riêng** (ngoài phí thành viên): làm mới tin, đẩy TOP/VIP theo ngày — ngày hết hạn tin = ngày đăng/làm mới/chạy TOP-UP gần nhất + 30 ngày (bất kể ngày nào muộn hơn).
- Hết hạn gói thành viên ≠ hết hạn tin: tin vẫn hiển thị tới khi hết hạn riêng của nó, nhưng không đăng tin mới/không tương tác được.
- **Nguồn thu phụ:** banner quảng cáo (bán theo vị trí, có bảng giá riêng), lead-gen cho ngân hàng (vay mua nhà), rất có thể cả link affiliate qua muaban.net/vieclam.net.

### 1.12 Hạ tầng kỹ thuật quan sát được
- **Analytics:** Google Tag Manager (`GTM-WC9T99`) — 1 container duy nhất quản lý toàn bộ tracking (GA4, Facebook Pixel, conversion pixel ngân hàng...).
- **Chống scrape cơ bản:** email hiển thị qua Cloudflare email-protection (`/cdn-cgi/l/email-protection`); SĐT môi giới ẩn sau click (không nằm sẵn trong HTML ban đầu — có thể lazy-fetch qua API riêng để đếm lượt xem số).
- **SEO kỹ thuật:** meta `og:*`, `twitter:card`, `canonical` đầy đủ mọi trang; H1 nhúng biến thời gian động; alt text ảnh lấy luôn tiêu đề tin; sitemap ẩn nhưng chắc chắn có (>500k tin index).
- **Responsive/PWA nhẹ:** meta `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `theme-color` (#fdce09 — màu vàng thương hiệu Mogi) → có thể "Add to Home Screen" trên mobile.
- **CSDL ước lượng quy mô:** riêng khu vực TPHCM listing "mua-nha-dat" đã show 543.618 tin — hệ thống chắc chắn dùng **search engine chuyên dụng** (Elasticsearch/Solr/Sphinx) chứ không query trực tiếp RDBMS cho trang list, kết hợp cache tầng CDN/Varnish cho các trang danh mục tĩnh.

---

## PHẦN 2 — ĐẶC TẢ KIẾN TRÚC DỰ ÁN MỚI (đề xuất)

### 2.1 Nguyên tắc thiết kế
1. **SEO-first bắt buộc** — vì toàn bộ giá trị của mô hình này nằm ở organic traffic (Mogi không chạy được nếu mất Google). → cần SSR/SSG thực sự, không phải SPA thuần CSR.
2. **Tách rời 3 miền:** (a) Core Marketplace (listing, tìm kiếm, tài khoản, thanh toán), (b) Content/CMS (blog, hướng dẫn, tin tức), (c) Admin/Kiểm duyệt nội bộ. Có thể dùng chung DB nhưng code base tách module rõ ràng để sau này tách service dễ dàng.
3. **Ưu tiên launch nhanh với dữ liệu thật** — MVP không cần AI định giá hay review khu vực ngay, những tính năng đó là giai đoạn 2-3.
4. **Không tự build search engine từ đầu** — dùng Meilisearch/Typesense (self-host, nhẹ, tiếng Việt tốt) hoặc Elasticsearch nếu cần scale lớn hơn.

### 2.2 Đề xuất tech stack

| Lớp | Lựa chọn đề xuất | Lý do |
|---|---|---|
| Frontend (web công khai) | **Next.js 14+ (App Router) + TypeScript + Tailwind CSS** | Cần SSR/ISR cho SEO — Next.js là lựa chọn thực tế nhất, hỗ trợ ISR để trang danh mục "vừa tĩnh vừa tươi" giống cách Mogi cập nhật H1 theo tháng mà không render lại toàn site |
| State/data fetching | **TanStack Query** + Server Components | Giảm boilerplate, cache thông minh |
| Backend API | **Node.js (NestJS)** hoặc Next.js Route Handlers cho API nhẹ, tách **NestJS riêng** nếu có đội backend | NestJS cho cấu trúc module rõ ràng (Auth, Listings, Users, Brokers, Projects, Payments) — dễ maintain khi phình to như Mogi |
| Database chính | **PostgreSQL** (+ **PostGIS** cho tọa độ/tìm kiếm theo bán kính) | Quan hệ Listing–User–Project–Broker–Location rất rõ ràng, PostGIS xử lý "tin gần vị trí X" tốt hơn Mongo |
| Search engine | **Meilisearch** (MVP) → **Elasticsearch** (khi >1 triệu tin) | Tốc độ lọc đa tiêu chí (giá, diện tích, phòng ngủ, khu vực) mà Postgres LIKE không kham nổi ở quy mô lớn |
| Cache | **Redis** | Cache kết quả search phổ biến, cache số đếm tin theo khu vực, session/OTP |
| Lưu trữ ảnh | **Cloudflare R2 / S3-compatible** + biến đổi ảnh qua **Cloudinary hoặc self-host imgproxy** | Ảnh là chi phí băng thông lớn nhất của site này — cần resize/webp tự động như Mogi làm với `cloud.mogi.vn` |
| Auth | **OTP qua SMS** (nhà cung cấp VN: eSMS, SpeedSMS, hoặc Twilio Verify) + JWT/session | Người dùng Việt Nam quen OTP SĐT hơn email — đúng như Mogi đang làm; email chỉ nên là kênh phụ |
| Thanh toán | **VNPay / MoMo / ZaloPay** cho gói thành viên | Bắt buộc với thị trường VN B2C/B2B nhỏ lẻ (môi giới cá nhân) |
| CMS nội dung (blog/help) | **WordPress headless** hoặc **Payload CMS / Strapi** nếu muốn tự chủ 100% code | Mogi dùng WordPress cho `trogiup.mogi.vn` — hợp lý vì đội content không cần biết code; nếu bạn tự viết content thì Strapi/Payload gọn hơn |
| CDN/Edge | **Cloudflare** (cache tĩnh + chống bot cào SĐT/email) | Bắt chước cơ chế ẩn email/SĐT của Mogi |
| Bản đồ | **Goong Maps** (VN, rẻ hơn Google Maps) hoặc Google Maps Platform | Cho "tiện ích xung quanh" + review khu vực |
| Hạ tầng | **Docker Compose** (dev) → **VPS/K8s đơn giản** (production ban đầu, chưa cần K8s phức tạp khi <100k tin) | Đừng over-engineer ở giai đoạn đầu |

> Ghi chú: nếu bạn muốn tối giản hơn để 1 người maintain (như style dự án pijama hiện tại của bạn: React + Vite + Express), vẫn khả thi ở quy mô nhỏ (<10k tin) — chỉ cần thay Next.js bằng **React + Vite + react-helmet cho meta tags** và chấp nhận SEO yếu hơn ban đầu, kèm 1 service **prerender.io hoặc SSR nhẹ qua Express + Vite SSR** khi cần index tốt hơn. Next.js vẫn là lựa chọn an toàn hơn nếu SEO là sống còn.

### 2.3 Mô hình dữ liệu cốt lõi (ERD rút gọn)

```
User (id, phone, password_hash, full_name, avatar_url, role[buyer|seller|broker|admin],
      is_phone_verified, created_at, membership_id?)

Membership (id, user_id, plan[trial|standard|premium], region_scope[], max_active_listings,
            started_at, expires_at, status)

Listing (id, owner_id → User, project_id? → Project,
         type[sale|rent], property_type[house|apartment|land|shophouse|room|warehouse|office],
         title, slug, description,
         price, price_unit, area_use, area_land, land_width, land_length,
         bedrooms, bathrooms, legal_status[so_do|so_hong|hop_dong|dang_cho_so],
         province, district, ward, street, address_full, lat, lng,
         status[pending_review|active|expired|rejected|sold],
         posted_at, renewed_at, expires_at, view_count, save_count,
         is_vip, vip_expires_at)

ListingImage (id, listing_id, url, order, is_cover)

Project (id, name, slug, developer_name, province, district,
         handover_year, price_from, price_per_sqm_range, description, thumbnail_url)

SavedListing (user_id, listing_id, created_at)     -- "BĐS đã lưu"
SavedSearch  (id, user_id, filters_json, created_at) -- "Tìm kiếm đã lưu"

Report (id, listing_id, reporter_id?, reason, note, status, created_at)  -- "Báo vi phạm"

PriceIndex (id, region_id, region_type[district|ward], month,
            avg_price_per_sqm, change_percent, sample_size)   -- nguồn cho trang "Giá nhà đất"

AreaReview (id, ward_id, title, video_url, amenities_json, content_html)  -- "Review khu vực"

Transaction (id, user_id, membership_id? , listing_id?(nếu mua đẩy tin),
             amount, gateway[vnpay|momo|zalopay], status, created_at)
```

### 2.4 Bản đồ route đề xuất (frontend)

```
/                                                  Trang chủ
/mua-ban/{loai-hinh}                               vd: /mua-ban/nha, /mua-ban/can-ho
/thue/{loai-hinh}
/{tinh-thanh}/{loai-tin}                           vd: /ho-chi-minh/mua-ban
/{tinh-thanh}/{quan}/{loai-tin}
/tin/{slug}-{id}                                   Trang chi tiết tin đăng
/du-an, /du-an/{slug}-{id}
/moi-gioi, /moi-gioi/{slug}-{id}
/gia-nha-dat, /gia-nha-dat/{tinh}/{quan}
/khu-vuc, /khu-vuc/{tinh}/{phuong}                  Review khu vực
/dang-nhap  (modal, không phải trang riêng — theo đúng UX Mogi)
/dang-tin                                          wizard đăng tin (auth required)
/tai-khoan/quan-ly-tin
/tai-khoan/tin-da-luu
/tai-khoan/tim-kiem-da-luu
/tai-khoan/thong-tin
/blog/* (hoặc subdomain content.domain.vn)
```

### 2.5 Luồng người dùng chính (Customer Journeys)

**A. Người tìm thuê (Miễn phí 100%):**
Landing (Google/Ads) → Trang danh sách (áp filter: giá, tiện ích, trường ĐH) → Trang chi tiết → Xem thông tin người tư vấn & trực tiếp dẫn xem (Quan) → Bấm gọi / Zalo / Gửi yêu cầu đặt lịch xem phòng → Quan liên hệ xác nhận lịch, trực tiếp dẫn xem tận nơi → Khách gặp chủ, ký HĐ thuê trực tiếp với chủ và nhận bàn giao phòng (Khách không trả bất kỳ khoản phí môi giới nào).

**B. Người cho thuê / Chủ phòng:**
Gửi thông tin phòng → Ký thỏa thuận dịch vụ môi giới (HĐ-01) với điều khoản phí thành công 40% tháng đầu → Tin được biên tập, kiểm duyệt và xuất bản với thông tin đầu mối là Quan → Quan sàng lọc nhu cầu, dẫn khách tới xem phòng → Chủ và khách ký HĐ thuê trực tiếp (HĐ-02), bàn giao phòng và nhận tiền thuê kỳ đầu → Chủ thanh toán phí dịch vụ 40% cho doanh nghiệp trong 2 ngày làm việc.

**C. Quan (Người điều phối & trực tiếp dẫn xem) / Admin:**
Tiếp nhận lead vào hàng đợi tập trung → Sàng lọc nhu cầu khách qua điện thoại/Zalo → Xác nhận lịch xem (tối đa 3 lịch/ngày) → Trực tiếp dẫn khách xem phòng → Hỗ trợ đối chiếu hồ sơ, chứng kiến ký HĐ-02 và bàn giao → Xác nhận giao dịch thành công (RentalDeal đủ điều kiện tại §6.2) → Tạo công nợ phí (Commission DUE) → Đối soát giao dịch chuyển khoản ngân hàng thật và xác nhận thanh toán (PAID).

### 2.6 Chiến lược SEO/Content (bắt buộc nếu muốn cạnh tranh mảng này)
- Mỗi trang danh mục (tỉnh × quận × loại hình) cần **unique content block** ở cuối trang — có thể generate bán tự động (template + biến số liệu thật, KHÔNG spin nội dung rác) để tránh duplicate content bị Google phạt.
- H1/meta title/description **render động theo tháng/năm hiện tại** như Mogi (`...T8/2026`) để tin luôn "mới" trong mắt Google — cần cron job cập nhật cache mỗi đầu tháng.
- Cấu trúc URL phẳng, có nghĩa, không dùng ID số làm URL chính (ID chỉ nên là hậu tố chống trùng slug).
- Sitemap.xml chia nhỏ theo loại (sitemap-listings-1.xml, sitemap-projects.xml...) vì số lượng URL sẽ vượt giới hạn 50k/file rất nhanh nếu scale.
- Structured data (Schema.org `RealEstateListing`, `Product`, `Offer`) cho mọi trang chi tiết tin — tăng khả năng hiện rich snippet giá/ảnh trên Google.

### 2.7 Chống lạm dụng & Trust-safety (Chuẩn mô hình môi giới Quan điều phối)
- **Đầu mối liên hệ duy nhất**: Tất cả tin đăng công khai đều hiển thị thông tin liên hệ của Quan ("Người tư vấn và trực tiếp dẫn xem"), tuyệt đối không để lộ số điện thoại riêng của chủ phòng ra ngoài qua API, SSR, JSON-LD, hay cache (vô hiệu hóa endpoint `revealPhone` cũ).
- **Hàng đợi lead tập trung**: Lead từ form hoặc yêu cầu lịch xem tự động gán cho Quan phụ trách; chủ phòng không xem được số điện thoại khách trước giai đoạn giới thiệu chốt giao dịch.
- **Báo vi phạm tin đăng**: Khách thuê có thể báo cáo tin đã hết phòng, sai giá thực tế hoặc không đúng thông tin kiểm tra.
- **Cơ chế OTP bảo mật**: OTP xác thực số điện thoại dùng CSPRNG, lưu trữ chia sẻ TTL và rate limit chống brute-force.
- **Nguyên tắc an toàn tài chính**: Chỉ ghi nhận phí môi giới `PAID` khi có giao dịch ngân hàng thật khớp mã tham chiếu đối soát; một giao dịch chỉ phát sinh đúng 1 khoản phí gốc.

### 2.8 Lộ trình triển khai đề xuất (Xem chi tiết tại ke-hoach-thuc-thi-moi-gioi-cho-thue.md)
- **Gate G0**: Chốt mô hình, pháp lý và hạ tầng kỹ thuật ban đầu.
- **Gate G1**: Liên hệ và nguồn cung (DEV-01, DEV-02, DEV-03, DEV-06, DEV-11, DEV-13).
- **Gate G2**: Lead và lịch bạn dẫn (DEV-04, DEV-05, DEV-07, DEV-12).
- **Gate G3**: Hợp đồng và tiền (DEV-08, DEV-09, DEV-10, DEV-12).
- **Gate G4**: Diễn tập và nghiệm thu 30 ca AT-01 → AT-30 (DEV-14).
- **Gate G5**: Pilot 14 ngày vận hành thực tế (10–20 phòng).

### 2.9 Quy ước code bắt buộc
- Ưu tiên Server Components cho mọi trang liệt kê/SEO; chỉ dùng Client Components cho phần tương tác (filter form, modal auth, gallery).
- Mọi trang public **phải** có: `<title>`, meta description, canonical, Open Graph — không merge PR thiếu SEO tag.
- **Tuyệt đối không thêm dấu chấm vào cuối câu** trên bất kỳ nội dung UI, meta description, thông báo lỗi, toast, popup nào người dùng nhìn thấy (GEMINI.md § 8).
- Slug tạo tự động từ tiêu đề (bỏ dấu, lowercase, nối `-`), luôn hậu tố `id{number}` để tránh trùng và cho phép đổi tiêu đề mà không vỡ URL cũ (301 redirect slug cũ → slug mới, giữ nguyên ID).
- Giá tiền luôn lưu ở đơn vị nhỏ nhất (VNĐ, số nguyên `BigInt`) trong DB, chỉ format ở tầng hiển thị.
- Phí dịch vụ môi giới tính theo basis points (4000/10000 = 40%) trên cơ sở tiền thuê thuần tháng đầu tiên sau ưu đãi; không dùng số thực JS cho các phép tính tiền.
- Không bao giờ trả số điện thoại riêng của chủ trong API public hoặc danh sách tin; liên hệ hiển thị là của Quan từ `SITE_CONFIG`.
- Mọi thay đổi schema Listing phải cân nhắc tính toàn vẹn và migration tương thích ngược.

---

## PHẦN 3 — GHI CHÚ & GIỚI HẠN CỦA PHÂN TÍCH NÀY
- Phân tích dựa trên **HTML tĩnh lấy qua fetch** (không chạy JavaScript), nên các hành vi động sau **chưa quan sát được trực tiếp** và cần bạn tự kiểm tra bằng DevTools khi cần độ chính xác 100%: autocomplete ô tìm kiếm, cơ chế gọi API ẩn số điện thoại, bản đồ tương tác "tiện ích xung quanh", cấu trúc JSON API nội bộ (endpoint, payload).
- Số liệu (giá/m², số tin) là **snapshot tại thời điểm truy cập (30/08/2026)**, sẽ thay đổi theo thời gian — không dùng làm số liệu thị trường chính thức.
- Suy đoán công nghệ backend (ASP.NET) dựa trên pattern URL, **không phải xác nhận chính thức** từ phía Mogi.

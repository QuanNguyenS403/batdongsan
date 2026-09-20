# RELEASE-READINESS.md — Báo Cáo Sẵn Sàng Phát Hành & Cổng Nghiệm Thu

- **Dự án**: Nền tảng Cho thuê QNS
- **Căn cứ**: Mục 11 ("Bộ nghiệm thu tối thiểu") và Mục 12.1 trong `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)
- **Ngày đánh giá**: 21/09/2026

---

## 1. Bảng Đối Chiếu 10 Mục Nghiệm Thu Tối Thiểu (§11)

| STT | Mục tiêu nghiệm thu | Trạng thái hiện tại | Bằng chứng & Đánh giá chi tiết | Đợt giải quyết |
|:---:|---|:---:|---|:---:|
| **1** | Người thuê lọc/lưu/xem chi phí/liên hệ đúng người; quay lại không mất bộ lọc; lỗi mạng không hiện thành dữ liệu trống giả | **In Progress** | Đã có lưu tin, bảng phí MoveInCostEstimator; `Promise.all` trang chủ và fallback cần sửa trong Đợt 1 (F16, FE-N22) | Đợt 1 & 3 |
| **2** | Chủ A đăng/sửa/upload chỉ tin của mình; user B không truy cập qua đổi ID; sửa phần quan trọng đưa tin về duyệt lại | **In Progress** | Đã có kiểm tra ownership; cần củng cố CAS duyệt tin và atomic quota trong Đợt 2 (RB-05) | Đợt 2 |
| **3** | Tin hết hạn/đã thuê/chủ bị khóa ngừng công khai và ngừng nhận lead đúng policy | **In Progress** | `getPublicWhereClause()` đã áp dụng cho listings; cần gắn vào `LeadsService.createLead` trong Đợt 2 (RB-11) | Đợt 2 |
| **4** | Gói miễn phí/trả phí/hết hạn/gia hạn/nâng/hạ cấp có quyền lợi xác định; snapshot không bị đổi khi sửa danh mục | **In Progress** | Đã có `planSnapshot` trên model; cần đồng bộ toàn bộ hàm kiểm tra quota đọc từ snapshot trong Đợt 2 (F04) | Đợt 2 & 3 |
| **5** | Duyệt tiền/hoàn/retry/song song không sai số và không trùng; pending không là tiền thu; có đối soát chứng từ | **In Progress** | Đã tách quoted vs confirmed; cần DTO bắt buộc `externalTransactionId` và `confirmedAmount > 0` trong Đợt 1 (F02, F03) | Đợt 1 & 4 |
| **6** | OTP nhiều instance, brute-force/rate-limit, thu hồi session, MFA/admin và recovery đều có test hành vi | **In Progress** | Đã có tokenVersion; cần tích hợp Redis store cho OTP và crypto.randomInt trong Đợt 2 (RB-02, F06) | Đợt 2 & 4 |
| **7** | Worker chết giữa chừng khôi phục được; provider lỗi có retry/DLQ; không mất sự kiện | **In Progress** | Đã có Outbox schema; cần cơ chế lease/reclaim 5 phút và gắn outbox vào tất cả mutation trong Đợt 3 (RB-06, RB-07) | Đợt 3 |
| **8** | Restore backup trên môi trường tách biệt thành công, kiểm tra dữ liệu và totals (RPO $\le 24\text{h}$, RTO $\le 4\text{h}$) | **Đạt Baseline** | Kịch bản `backup-restore-drill.js` chạy thành công đạt RTO 13.25s, checksum SHA-256 uploads 100% khớp | Đợt 0 & 5 |
| **9** | Build/typecheck/lint thật + SCA + integration + E2E trong CI; không dùng script kiểm tra chuỗi thay cho test nghiệp vụ | **Đạt Baseline** | Typecheck API & Web 100% pass; build monorepo pass; CI workflow có static-lint-check và smoke test | Đợt 0 & 5 |
| **10** | Có ảnh desktop/mobile trước/sau, kết quả accessibility/performance, danh sách vấn đề tồn và người chịu trách nhiệm | **Chờ Pilot** | Cần thực hiện ghi hình và chụp ảnh sau khi hoàn thành các đợt sửa đổi giao diện | Đợt 3 & 5 |

---

## 2. Rủi Ro Còn Lại & Điều Kiện Phát Hành (Release Gates)

### Rủi ro trọng yếu hiện tại:
1. **Lỗi Rules of Hooks trong ContactBrokerModal** (FE-N01) $\rightarrow$ Nguy cơ khách không thể gửi form liên hệ trên trình duyệt.
2. **Fallback bảng giá tĩnh ở production** (FE-N02) $\rightarrow$ Nguy cơ khách chuyển khoản khi backend offline.
3. **Copy metadata còn từ "chính chủ"** (F15, BR-01) $\rightarrow$ Vi phạm cam kết trung thực và định vị thương hiệu.
4. **Duyệt tiền thiếu DTO chặt chẽ** (F02, F03) $\rightarrow$ Nguy cơ admin nhập dữ liệu tài chính không hợp lệ.

### Điều kiện tiên quyết để mở Pilot:
- Hoàn thành Đợt 1 (Gate A) và Đợt 2 (Gate B).
- Không còn bất kỳ phát hiện P0 nào trong sổ theo dõi `EXECUTION-STATUS.md`.
- Toàn bộ từ ngữ cấm được rà soát và loại bỏ 100%.
- Kiểm thử luồng gửi lead và chuyển khoản đạt tỷ lệ thành công 100% trên môi trường thử nghiệm.

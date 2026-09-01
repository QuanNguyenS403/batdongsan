# Trạng thái phiên làm việc hiện tại

**Việc dở dang:** Không có — vừa hoàn thành 2 việc: (1) đợt audit nghiêm ngặt lần 2 (12 lỗi thật
đã sửa, xem `TRANG-THAI-TRIEN-KHAI.md`), (2) chuyển đổi bộ tài liệu vận hành từ Cline sang AI
agent chạy trên Gemini 3.7 Flash — `.clinerules/` đã xoá, thay bằng `GEMINI.md` ở gốc repo (đúng
quy ước file ngữ cảnh dự án của hệ sinh thái Gemini, vai trò tương đương `CLAUDE.md`). Toàn bộ
`skills/*.md` đã rà lại, không còn tham chiếu "Cline" nào ngoài 1 dòng ghi chú lịch sử trong
`GEMINI.md`.

**Việc tiếp theo đề xuất (chưa bắt đầu):**
1. Chạy lại `pnpm install` trên máy thật để nhận 2 dependency mới (`dotenv`, `dotenv-cli`) từ
   đợt audit lần 2, rồi test lại toàn bộ theo checklist QA đã đưa cho người dùng.
2. Khi tiếp tục phát triển bằng agent Gemini, nạp `GEMINI.md` + `CLAUDE.md` + `README.md` +
   `TRANG-THAI-TRIEN-KHAI.md` vào ngữ cảnh trước, sau đó theo cơ chế nhận lệnh mô tả trong
   `skills/00-muc-luc-va-quy-trinh.md`.
3. Nhận dữ liệu BĐS thật từ khách hàng → chạy `pnpm db:import-listings`.
4. Tích hợp Meilisearch khi số lượng tin đủ lớn để cần tìm kiếm nâng cao.

# TEST-EVIDENCE.md — Nhật Ký Bằng Chứng Kiểm Thử & Nghiệm Thu

- **Dự án**: Nền tảng Cho thuê QNS
- **Căn cứ**: Mục 12.1 trong `Ban-thu-hoach-va-chi-thi-AI-agent-batdongsan.md` (19/09/2026)
- **Nguyên tắc**: Tuyệt đối không ngụy tạo kết quả; ghi nhận trung thực lệnh, môi trường, thời gian và kết quả thực tế.

---

## 1. Nhật Ký Kiểm Thử Đợt 0 (Baseline Snapshot — 21/09/2026)

### Bài kiểm tra T01: Node.js & pnpm Toolchain Verification
- **Lệnh thực thi**: `pnpm --version; node --version`
- **Môi trường**: Windows 11, Node `v24.19.0`, pnpm `9.15.9`
- **Thời gian**: 2026-09-21 01:16:05
- **Kết quả**: **PASS**
- **Log trích xuất**:
  ```text
  9.15.9
  v24.19.0
  ```

### Bài kiểm tra T02: Database Package Build (Prisma Client Generation)
- **Lệnh thực thi**: `pnpm --filter @batdongsan/database build`
- **Môi trường**: Local dev, Prisma v5.22.0
- **Thời gian**: 2026-09-21 01:16:20
- **Kết quả**: **PASS**
- **Log trích xuất**:
  ```text
  ✔ Generated Prisma Client (v5.22.0) to .\..\..\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client in 268ms
  ```

### Bài kiểm tra T03: Static Structure Lint (Cấu trúc mã nguồn tĩnh)
- **Lệnh thực thi**: `node packages/database/scripts/static-lint-check.js`
- **Môi trường**: Local sandbox
- **Thời gian**: 2026-09-21 01:16:09
- **Kết quả**: **PASS (5/5 checks)**
- **Ghi chú**: Xác minh cấu trúc schema, DDL migrations, DTO decorators, Outbox, không chứa credential cũ.
- **Log trích xuất**:
  ```text
  [OK - Cấu trúc khớp] Prisma Schema: Chứa các entity cốt lõi (Lead, OutboxEvent, FinanceLedger, AuditEvent)
  [OK - Cấu trúc khớp] Migrations: Có đủ các bước migration DDL từ khởi tạo tới Wave 5
  [OK - Cấu trúc khớp] Security: auth.service.ts không chứa backdoor credential admin cũ
  [OK - Cấu trúc khớp] DTOs: Có decorators class-validator thắt chặt cho Listings DTOs
  [OK - Cấu trúc khớp] Outbox: OutboxService có khai báo DLQ, retry và transactional outbox method
  🏁 KẾT QUẢ STATIC LINT: 5/5 cấu trúc tệp mã nguồn khớp.
  ```

### Bài kiểm tra T04: NestJS Backend Typecheck
- **Lệnh thực thi**: `pnpm --filter @batdongsan/api exec tsc --noEmit`
- **Môi trường**: TypeScript 5.x, NestJS 10.x
- **Thời gian**: 2026-09-21 01:16:47
- **Kết quả**: **PASS (Exit code 0, 0 errors)**

### Bài kiểm tra T05: Next.js Frontend Typecheck
- **Lệnh thực thi**: `pnpm --filter @batdongsan/web exec tsc --noEmit`
- **Môi trường**: TypeScript 5.x, Next.js 14.2.15 (App Router)
- **Thời gian**: 2026-09-21 01:16:56
- **Kết quả**: **PASS (Exit code 0, 0 errors)**

### Bài kiểm tra T06: Rà soát Từ Khóa Cấm (Prohibited Copy Grep)
- **Lệnh thực thi**: Grep toàn bộ thư mục `apps/` đối với các cụm: *"100% chính chủ"*, *"không lừa đảo"*, *"an toàn tuyệt đối"*, *"chắc chắn có khách"*, *"chính chủ"*.
- **Thời gian**: 2026-09-21 01:16:35 – 01:16:45
- **Kết quả phát hiện**:
  - Không tìm thấy cụm từ *"không lừa đảo"*, *"an toàn tuyệt đối"*, *"chắc chắn có khách"*.
  - Phát hiện từ *"chính chủ"* tại 7 tệp: `demo-data.ts`, `thue/page.tsx`, `tin/[slug]/page.tsx`, `layout.tsx`, `AuthModal.tsx`, `cho-thue-tro/page.tsx`, `cho-thue-mat-bang/page.tsx`.
  - $\rightarrow$ **Cần xử lý triệt để trong Đợt 1 (Gate A)**.

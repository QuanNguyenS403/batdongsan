# Skill 05 — Tích hợp tìm kiếm (Meilisearch)

## Mục tiêu
Tách truy vấn lọc/đếm tin đăng đa điều kiện ra khỏi PostgreSQL sang Meilisearch, đúng nguyên lý đã rút ra từ Mogi (`CLAUDE.md § 1.12`, `README.md § 7`).

## Điều kiện tiên quyết
- Skill 04 đã xong (có dữ liệu `listings` để đồng bộ).
- Meilisearch container đã chạy (skill 01).

## Các bước thực hiện

### Bước 1 — Cài đặt
```bash
cd apps/api
pnpm add meilisearch
```

### Bước 2 — Định nghĩa index
Tạo index `listings` với cấu hình (`modules/search/search.service.ts`, chạy 1 lần khi bootstrap hoặc qua script `setup-index.ts`):
```ts
await client.index('listings').updateSettings({
  searchableAttributes: ['title', 'description', 'addressDetail'],
  filterableAttributes: [
    'status', 'transactionType', 'propertyType',
    'locationProvinceSlug', 'locationDistrictSlug', 'locationWardSlug',
    'price', 'areaM2', 'bedrooms', 'bathrooms', 'legalStatus', 'projectId'
  ],
  sortableAttributes: ['price', 'areaM2', 'publishedAt', 'viewCount'],
  rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
});
```

### Bước 3 — Đồng bộ dữ liệu (event-driven, khớp `README.md § 13` mục Search)
- Trong `ListingsService`, sau mỗi lần `create`/`update`/xoá/status đổi → gọi `searchService.syncListing(listing)` hoặc `searchService.removeListing(id)`.
- Document đẩy vào Meilisearch phải **denormalize** sẵn tên tỉnh/quận/phường (join từ `Location`) để filter theo slug nhanh, không cần join lúc query.
- Chỉ đồng bộ tin có `status IN (active, expired)` — tin `pending/rejected/removed` không index (tránh lộ tin chưa duyệt ra kết quả tìm kiếm).

### Bước 4 — Script backfill dữ liệu cũ
`packages/database/scripts/reindex-listings.ts` (hoặc đặt trong `apps/api/src/scripts/`): quét toàn bộ `listings` hợp lệ trong Postgres, đẩy hàng loạt (`addDocuments` theo batch 1000) vào Meilisearch — dùng khi mới triển khai hoặc khi đổi cấu trúc index.

### Bước 5 — Endpoint tìm kiếm mới thay thế query Postgres trực tiếp
Sửa `GET /listings` (skill 04) để khi có tham số filter phức tạp/`keyword`, gọi qua `SearchService.search()` thay vì Prisma `findMany` trực tiếp — Prisma vẫn dùng cho `GET /listings/:id` (đọc 1 bản ghi) và các thao tác ghi.

Trả kèm `estimatedTotalHits` từ Meilisearch để FE hiển thị "1 - 15 trong X" giống Mogi.

### Bước 6 — Đếm số tin theo khu vực/loại hình (cho chip filter cuối trang danh sách)
Dùng Meilisearch **facet search** (`facets: ['propertyType', 'locationDistrictSlug']`) để lấy số lượng theo từng giá trị filter trong 1 lần gọi, tránh N+1 query.

## Kiểm thử nhanh
```bash
pnpm --filter api run script:reindex-listings
curl "localhost:4000/listings?keyword=chung cư quận 7&priceMax=3000000000&sort=price:asc"
```

## Definition of Done
- [ ] Index `listings` cấu hình đúng searchable/filterable/sortable attributes.
- [ ] Tạo/sửa/xoá tin tự động đồng bộ Meilisearch (test bằng cách tạo tin mới rồi search ngay).
- [ ] Endpoint search trả `estimatedTotalHits` + facet count đúng.
- [ ] Script backfill chạy được cho dữ liệu có sẵn.
- [ ] Cập nhật `memory-bank/progress.md`: skill 05 → ✅ Xong.

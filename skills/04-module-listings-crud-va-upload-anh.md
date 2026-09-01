# Skill 04 — Module Tin đăng (Listings) CRUD + Upload ảnh

## Mục tiêu
Module lõi của toàn hệ thống: tạo/sửa/xoá/liệt kê tin đăng, upload ảnh lên S3-compatible storage, sinh slug tự động, quản lý vòng đời trạng thái tin.

## Điều kiện tiên quyết
- Skill 02 (schema `listings`, `listing_images`), Skill 03 (auth JWT + guard) đã xong.

## Các bước thực hiện

### Bước 1 — Cài thư viện upload
```bash
cd apps/api
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer @nestjs/platform-express
pnpm add sharp   # resize/optimize ảnh phía server
pnpm add slugify
```

### Bước 2 — DTO & sinh slug
`modules/listings/dto/create-listing.dto.ts` — validate đầy đủ theo bảng `listings` (transactionType, propertyType, title, price, areaM2, bedrooms?, bathrooms?, legalStatus?, locationId, addressDetail?, lat?, lng?, projectId?).

Hàm sinh slug (`common/utils/slugify-listing.ts`):
```ts
export function buildListingSlug(title: string, id: bigint): string {
  const base = slugify(title, { lower: true, locale: 'vi', strict: true });
  return `${base}-id${id}`;
}
```
Lưu ý: vì slug cần ID mà ID chỉ có sau khi insert → tạo record trước với slug tạm (`title-slug-idTEMP`), sau đó `UPDATE` lại slug thật bằng ID vừa sinh trong cùng transaction Prisma (`$transaction`).

### Bước 3 — Endpoint (khớp `README.md § 13`)
```
GET    /listings                 ?province=&district=&type=&propertyType=&priceMin=&priceMax=&areaMin=&areaMax=&bedrooms=&page=&pageSize=
GET    /listings/:idOrSlug       (chấp nhận cả "id123" lẫn full slug, tách ID bằng regex /-id(\d+)$/)
POST   /listings                 (JWT required) → status mặc định = pending
PUT    /listings/:id             (JWT required, chỉ owner hoặc admin)
DELETE /listings/:id             (JWT required, soft-delete → status = removed)
POST   /listings/:id/images      (multipart, tối đa 20 ảnh, JWT required, chỉ owner)
POST   /listings/:id/refresh     (JWT required, chỉ owner có gói hợp lệ) → cập nhật refreshedAt + expiresAt = now()+30d
POST   /listings/:id/report      (public, không cần auth) → tạo ListingReport
POST   /listings/:id/reveal-phone (JWT required) → trả số điện thoại owner + tăng revealPhoneCount + ghi log
```

### Bước 4 — Xử lý ảnh
1. Nhận file qua `FileInterceptor`/`FilesInterceptor`, giới hạn 10MB/ảnh, chỉ nhận `image/jpeg|png|webp`.
2. Dùng `sharp` resize về 3 kích thước: `thumbnail` (300px), `medium` (800px), `original` (giữ nguyên, nén chất lượng 85), convert sang `webp`.
3. Upload cả 3 biến thể lên S3 theo path: `listings/{listingId}/{uuid}-{size}.webp`.
4. Lưu record `ListingImage` với `imageUrl` trỏ tới biến thể `medium` làm mặc định hiển thị card, FE tự chọn biến thể theo context (xem skill 07).
5. Ảnh đầu tiên upload = `sortOrder=0` = ảnh bìa mặc định.

### Bước 5 — Vòng đời trạng thái (khớp `CLAUDE.md § 1.10` + `README.md § 8`)
```
pending → (admin duyệt, skill 11) → active → (30 ngày kể từ publishedAt/refreshedAt/boost gần nhất) → expired
active/pending → rejected (admin từ chối, kèm lý do)
active → removed (owner tự xoá hoặc admin gỡ do report)
```
Viết cron job trong `apps/worker` (BullMQ repeatable job, chạy mỗi giờ): quét `listings` có `status=active AND expiresAt < now()` → set `status=expired`. (Worker app khởi tạo chi tiết ở skill 13, ở đây chỉ cần định nghĩa job function, export để worker import.)

### Bước 6 — Bảo vệ số điện thoại
- Response của `GET /listings` và `GET /listings/:id` **không bao giờ** chứa field số điện thoại chủ tin — chỉ chứa `ownerName`, `ownerAvatarUrl`, `ownerJoinedAt`.
- Chỉ `POST /listings/:id/reveal-phone` (JWT required) mới trả phone, đồng thời insert log vào bảng phụ `phone_reveal_logs (listing_id, user_id, created_at)` — nếu bảng này chưa có trong schema, quay lại skill 02 thêm migration mới trước khi tiếp tục.

## Kiểm thử nhanh
```bash
# Tạo tin (cần token từ skill 03)
curl -X POST localhost:4000/listings -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{...}'
# Upload ảnh
curl -X POST localhost:4000/listings/1/images -H "Authorization: Bearer <token>" -F "files=@test.jpg"
# Lọc danh sách
curl "localhost:4000/listings?province=ho-chi-minh&propertyType=can-ho&priceMax=3000000000"
```

## Definition of Done
- [ ] Toàn bộ 9 endpoint hoạt động đúng, có phân quyền owner/admin chính xác.
- [ ] Ảnh upload thành công, có 3 biến thể kích thước trên S3.
- [ ] Slug sinh đúng định dạng `-id{number}`, không trùng.
- [ ] API danh sách/chi tiết không rò rỉ số điện thoại; `reveal-phone` hoạt động + có log.
- [ ] Cron hết hạn tin đã viết (chưa cần chạy thật nếu worker app chưa dựng — ghi TODO rõ trong code).
- [ ] Cập nhật `memory-bank/progress.md`: skill 04 → ✅ Xong.

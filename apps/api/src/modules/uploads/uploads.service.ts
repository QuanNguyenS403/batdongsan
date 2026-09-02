import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

/**
 * UploadsService — driver LOCAL DISK cho môi trường dev (STORAGE_DRIVER=local).
 *
 * Khi triển khai thật, đổi sang driver S3-compatible (Cloudflare R2 / AWS S3):
 * implement thêm `S3UploadsService` cùng interface `saveListingImages()`, rồi
 * chọn provider theo STORAGE_DRIVER trong uploads.module.ts (dùng factory provider của Nest).
 * KHÔNG sửa listings.service.ts khi đổi driver — chỉ đổi ở tầng này.
 */
@Injectable()
export class UploadsService {
  // BUG ĐÃ SỬA (audit 02/09/2026): trước đây dùng `join(process.cwd(), 'uploads')`. Khi chạy monorepo
  // từ thư mục gốc qua Turborepo (pnpm dev), process.cwd() là gốc monorepo, trong khi ServeStaticModule
  // trong app.module.ts lại phục vụ từ `join(__dirname, '..', 'uploads')` (apps/api/uploads). Lệch thư
  // mục khiến 100% ảnh upload xong đều trả về 404 Not Found khi xem. Đồng bộ về apps/api/uploads.
  private readonly uploadsRoot = join(__dirname, '..', '..', '..', 'uploads');

  async saveListingImages(listingId: string, files: Express.Multer.File[]): Promise<string[]> {
    const dir = join(this.uploadsRoot, 'listings', listingId);
    await fs.mkdir(dir, { recursive: true });

    const publicUrls: string[] = [];

    for (const file of files) {
      const filename = `${randomUUID()}.webp`;
      const outputPath = join(dir, filename);

      // Resize về tối đa 1600px chiều rộng, convert sang webp chất lượng 85 để giảm dung lượng.
      await sharp(file.buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 85 }).toFile(outputPath);

      publicUrls.push(`/uploads/listings/${listingId}/${filename}`);
    }

    return publicUrls;
  }
}

import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Trước đây các controller dùng ParseIntPipe rồi tự BigInt(id) — ParseIntPipe ép giá trị qua
 * kiểu `number` của JS (an toàn chính xác tới 2^53), trong khi cột ID thật trong DB là BIGINT
 * (an toàn tới 2^63). Với một sàn giao dịch dự kiến hàng triệu tin đăng dài hạn, đây là rủi ro
 * tràn số âm thầm (silent precision loss) chứ không throw lỗi — rất khó phát hiện khi debug.
 * Pipe này parse thẳng string -> BigInt, không đi qua number ở giữa.
 */
@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException(`Tham số "${value}" không phải là ID hợp lệ.`);
    }
    return BigInt(value);
  }
}

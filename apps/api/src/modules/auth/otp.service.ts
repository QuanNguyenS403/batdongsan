import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  sentCount: number;
  windowStart: number;
}

/**
 * OtpService — quản lý sinh/gửi/xác thực OTP.
 *
 * Ở chế độ SMS_PROVIDER=mock (mặc định khi chưa có tài khoản nhà mạng SMS thật):
 * OTP KHÔNG được gửi qua SMS thật mà chỉ in ra console log của server — dùng để
 * phát triển/kiểm thử. Khi khách hàng có tài khoản eSMS/SpeedSMS/Twilio, cập nhật
 * `sendViaProvider()` bên dưới và đổi SMS_PROVIDER trong .env.
 *
 * Lưu trữ OTP: dùng in-memory Map cho môi trường dev đơn giản. Khi lên production
 * thật (nhiều instance API chạy song song), BẮT BUỘC đổi sang Redis (đã có sẵn
 * biến REDIS_URL trong .env) để OTP dùng chung được giữa các instance — xem TODO bên dưới.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly store = new Map<string, OtpRecord>();

  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 phút
  private readonly MAX_ATTEMPTS = 5;
  private readonly MAX_SENDS_PER_HOUR = 5;

  async sendOtp(phone: string): Promise<void> {
    const now = Date.now();
    const existing = this.store.get(phone);

    if (existing && now - existing.windowStart < 60 * 60 * 1000 && existing.sentCount >= this.MAX_SENDS_PER_HOUR) {
      // BUG ĐÃ SỬA (audit 02/09/2026): ném generic Error sẽ bị HttpExceptionFilter bắt và biến
      // thành 500 Internal Server Error với message chung chung, che giấu lý do thật. Phải ném
      // HttpException với status TOO_MANY_REQUESTS (429) để client hiển thị đúng thông báo.
      throw new HttpException('Bạn đã yêu cầu OTP quá nhiều lần trong 1 giờ. Vui lòng thử lại sau.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const windowStart = existing && now - existing.windowStart < 60 * 60 * 1000 ? existing.windowStart : now;
    const sentCount = existing && now - existing.windowStart < 60 * 60 * 1000 ? existing.sentCount + 1 : 1;

    this.store.set(phone, {
      code,
      expiresAt: now + this.OTP_TTL_MS,
      attempts: 0,
      sentCount,
      windowStart,
    });

    await this.sendViaProvider(phone, code);
  }

  verifyOtp(phone: string, code: string): boolean {
    const record = this.store.get(phone);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      this.store.delete(phone);
      return false;
    }

    if (record.attempts >= this.MAX_ATTEMPTS) {
      this.store.delete(phone);
      return false;
    }

    record.attempts += 1;

    if (record.code !== code) return false;

    this.store.delete(phone); // OTP dùng 1 lần
    return true;
  }

  private async sendViaProvider(phone: string, code: string): Promise<void> {
    const provider = process.env.SMS_PROVIDER ?? 'mock';

    if (provider === 'mock') {
      this.logger.warn(`[MOCK SMS] Gửi OTP tới ${phone}: ${code} (chỉ hiện trong log, KHÔNG gửi SMS thật)`);
      return;
    }

    // TODO: tích hợp nhà cung cấp SMS thật (eSMS / SpeedSMS / Twilio) tại đây khi có API key.
    // Ví dụ khung sườn:
    // if (provider === 'esms') {
    //   await axios.post('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/', {
    //     ApiKey: process.env.SMS_API_KEY,
    //     SecretKey: process.env.SMS_SECRET_KEY,
    //     Phone: phone,
    //     Content: `Ma OTP cua ban la: ${code}`,
    //     ...
    //   });
    // }
    this.logger.error(`SMS_PROVIDER="${provider}" chưa được implement. Đang fallback về chế độ mock.`);
    this.logger.warn(`[MOCK SMS] Gửi OTP tới ${phone}: ${code}`);
  }
}

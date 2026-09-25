import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';

interface ActiveOtp {
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RateLimitRecord {
  sentCount: number;
  windowStart: number;
}

/**
 * OtpService — quản lý sinh/gửi/xác thực OTP bảo mật cao.
 * GAP-15: Hỗ trợ lưu trữ Redis chia sẻ có TTL, CSPRNG crypto.randomInt, không log OTP thật ở production.
 * GAP-11 & AT-08: Ràng buộc OTP khớp chính xác số điện thoại yêu cầu, chống mượn OTP số khác hoặc replay.
 */
@Injectable()
export class OtpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OtpService.name);
  private redis: Redis | null = null;
  private readonly activeOtps = new Map<string, ActiveOtp>();
  private readonly rateLimits = new Map<string, RateLimitRecord>();

  private readonly OTP_TTL_SECONDS = 300; // 5 phút
  private readonly MAX_ATTEMPTS = 5;
  private readonly MAX_SENDS_PER_HOUR = 5;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        retryStrategy: () => null, // Không retry vô tận nếu redis offline
      });

      this.redis.on('error', (err) => {
        this.logger.warn(`Redis không khả dụng, sử dụng In-Memory OTP Store dự phòng: ${err.message}`);
        this.redis = null;
      });

      this.redis.on('connect', () => {
        this.logger.log('Đã kết nối Redis chia sẻ thành công cho OTP Service');
      });
    } catch {
      this.redis = null;
    }
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  /**
   * Sinh mã OTP và gửi qua SMS adapter
   */
  async sendOtp(phone: string): Promise<string> {
    const cleanPhone = phone.replace(/\s+/g, '');
    const now = Date.now();

    // 1. Kiểm tra Rate Limit 1 giờ (Redis hoặc Memory)
    if (this.redis) {
      const rateKey = `otp_rate:${cleanPhone}`;
      const count = await this.redis.incr(rateKey);
      if (count === 1) {
        await this.redis.expire(rateKey, 3600); // 1 giờ
      }
      if (count > this.MAX_SENDS_PER_HOUR) {
        throw new HttpException(
          'Bạn đã yêu cầu OTP quá nhiều lần trong 1 giờ, vui lòng thử lại sau',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      const rateRecord = this.rateLimits.get(cleanPhone);
      if (rateRecord) {
        if (now - rateRecord.windowStart < 3600 * 1000) {
          if (rateRecord.sentCount >= this.MAX_SENDS_PER_HOUR) {
            throw new HttpException(
              'Bạn đã yêu cầu OTP quá nhiều lần trong 1 giờ, vui lòng thử lại sau',
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
          rateRecord.sentCount += 1;
        } else {
          this.rateLimits.set(cleanPhone, { sentCount: 1, windowStart: now });
        }
      } else {
        this.rateLimits.set(cleanPhone, { sentCount: 1, windowStart: now });
      }
    }

    // 2. GAP-15: Sinh mã OTP ngẫu nhiên 6 chữ số bằng CSPRNG (crypto.randomInt)
    const code = crypto.randomInt(100000, 1000000).toString();

    // 3. Lưu OTP với TTL 5 phút
    if (this.redis) {
      const otpKey = `otp:${cleanPhone}`;
      const payload: ActiveOtp = {
        code,
        expiresAt: now + this.OTP_TTL_SECONDS * 1000,
        attempts: 0,
      };
      await this.redis.setex(otpKey, this.OTP_TTL_SECONDS, JSON.stringify(payload));
    } else {
      this.activeOtps.set(cleanPhone, {
        code,
        expiresAt: now + this.OTP_TTL_SECONDS * 1000,
        attempts: 0,
      });
    }

    // 4. Phát qua SMS Provider (ẩn OTP trong log production)
    await this.sendViaProvider(cleanPhone, code);
    return code;
  }

  /**
   * Xác thực mã OTP thông thường
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    if (!phone || !code || typeof phone !== 'string' || typeof code !== 'string') return false;
    const cleanPhone = phone.replace(/\s+/g, '');
    const cleanCode = code.trim();
    if (!cleanPhone || !cleanCode) return false;

    if (this.redis) {
      const otpKey = `otp:${cleanPhone}`;
      const raw = await this.redis.get(otpKey);
      if (!raw) return false;

      let record: ActiveOtp;
      try {
        record = JSON.parse(raw);
      } catch {
        await this.redis.del(otpKey);
        return false;
      }

      if (Date.now() > record.expiresAt) {
        await this.redis.del(otpKey);
        return false;
      }

      if (record.attempts >= this.MAX_ATTEMPTS) {
        await this.redis.del(otpKey);
        return false;
      }

      record.attempts += 1;

      if (record.code !== code) {
        const remainingTtl = Math.max(1, Math.floor((record.expiresAt - Date.now()) / 1000));
        await this.redis.setex(otpKey, remainingTtl, JSON.stringify(record));
        return false;
      }

      // Xóa OTP ngay sau khi xác thực thành công (chống replay - AT-08)
      await this.redis.del(otpKey);
      return true;
    } else {
      const record = this.activeOtps.get(cleanPhone);
      if (!record) return false;

      if (Date.now() > record.expiresAt) {
        this.activeOtps.delete(cleanPhone);
        return false;
      }

      if (record.attempts >= this.MAX_ATTEMPTS) {
        this.activeOtps.delete(cleanPhone);
        return false;
      }

      record.attempts += 1;

      if (record.code !== code) return false;

      this.activeOtps.delete(cleanPhone);
      return true;
    }
  }

  /**
   * Xác thực mã OTP có ràng buộc chặt chẽ với số điện thoại của yêu cầu (AT-08).
   * Tuyệt đối không cho phép dùng OTP của số A để xác thực lead số B.
   */
  async verifyOtpForPhone(targetPhone: string, inputPhone: string, code: string): Promise<boolean> {
    const cleanTarget = targetPhone.replace(/\s+/g, '');
    const cleanInput = inputPhone.replace(/\s+/g, '');

    // AT-08: Kiểm tra số điện thoại gửi OTP phải khớp chính xác với số của Lead
    if (cleanTarget !== cleanInput) {
      this.logger.warn(`AT-08: Phát hiện mượn OTP từ số khác (target=${cleanTarget}, input=${cleanInput})`);
      return false;
    }

    return this.verifyOtp(cleanTarget, code);
  }

  private async sendViaProvider(phone: string, code: string): Promise<void> {
    const isStaging = process.env.APP_ENV === 'staging' || process.env.SAFETY_NET_DISABLE_OUTBOUND === 'true';
    if (isStaging) {
      this.logger.warn(`🛡️ [SAFETY NET] Staging mode: Chặn gửi SMS thật tới ${phone}`);
      return;
    }

    const provider = process.env.SMS_PROVIDER ?? 'mock';

    if (provider === 'mock') {
      if (process.env.NODE_ENV === 'production') {
        throw new HttpException('Chế độ SMS mock không được phép chạy ở môi trường production', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      this.logger.log(`[DEV/TEST MOCK SMS] Gửi OTP tới ${phone}: ${code}`);
      return;
    }

    const timeoutMs = 5000;
    try {
      if (provider === 'esms') {
        const apiKey = process.env.SMS_API_KEY;
        const secretKey = process.env.SMS_SECRET_KEY;
        if (!apiKey || !secretKey) {
          throw new Error('Thiếu SMS_API_KEY hoặc SMS_SECRET_KEY cho eSMS');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ApiKey: apiKey,
            SecretKey: secretKey,
            Phone: phone,
            Content: `Ma xac thuc QNS BROKER cua ban la: ${code}. Hieu luc 5 phut.`,
            SmsType: '2',
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) throw new Error(`eSMS trả mã HTTP lỗi: ${res.status}`);
        const data: any = await res.json();
        if (data.CodeResult !== '100') {
          throw new Error(`eSMS từ chối gửi tin: ${data.ErrorMessage}`);
        }
        return;
      }

      if (provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromPhone = process.env.TWILIO_PHONE_NUMBER;
        if (!accountSid || !authToken || !fromPhone) {
          throw new Error('Thiếu TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN hoặc TWILIO_PHONE_NUMBER');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const params = new URLSearchParams();
        params.set('To', phone.startsWith('+') ? phone : `+84${phone.replace(/^0/, '')}`);
        params.set('From', fromPhone);
        params.set('Body', `Ma xac thuc QNS BROKER cua ban la: ${code}. Hieu luc 5 phut.`);

        const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) throw new Error(`Twilio trả mã HTTP lỗi: ${res.status}`);
        return;
      }

      if (provider === 'speedsms') {
        const accessToken = process.env.SMS_API_KEY;
        if (!accessToken) throw new Error('Thiếu SMS_API_KEY cho SpeedSMS');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch('https://api.speedsms.vn/index.php/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${accessToken}:x`).toString('base64')}`,
          },
          body: JSON.stringify({
            to: [phone],
            content: `Ma xac thuc QNS BROKER cua ban la: ${code}. Hieu luc 5 phut.`,
            sms_type: 2,
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) throw new Error(`SpeedSMS trả mã HTTP lỗi: ${res.status}`);
        return;
      }

      if (provider === 'telegram') {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!botToken || !chatId) {
          throw new Error('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID cho provider telegram');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `[QNS BROKER] Mã xác thực OTP cho số ${phone} là: ${code} (hiệu lực 5 phút)`,
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Telegram API trả mã HTTP lỗi: ${res.status} - ${errText}`);
        }
        return;
      }

      throw new Error(`SMS_PROVIDER="${provider}" không được hỗ trợ`);
    } catch (err: any) {
      this.logger.error(`Lỗi khi gửi SMS OTP qua provider "${provider}": ${err.message}`);
      throw new HttpException(
        'Không thể gửi mã xác thực SMS qua nhà mạng viễn thông, vui lòng thử lại sau',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /** Dọn dẹp bản ghi bộ nhớ dự phòng */
  cleanupExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [phone, record] of this.activeOtps.entries()) {
      if (now > record.expiresAt) {
        this.activeOtps.delete(phone);
        count++;
      }
    }
    for (const [phone, rate] of this.rateLimits.entries()) {
      if (now - rate.windowStart >= 3600 * 1000) {
        this.rateLimits.delete(phone);
      }
    }
    return count;
  }
}

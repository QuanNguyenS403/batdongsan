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

  async sendOtp(phone: string): Promise<string> {
    const now = Date.now();
    const existing = this.store.get(phone);

    if (existing && now - existing.windowStart < 60 * 60 * 1000 && existing.sentCount >= this.MAX_SENDS_PER_HOUR) {
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
    return code;
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
    const isStaging = process.env.APP_ENV === 'staging' || process.env.SAFETY_NET_DISABLE_OUTBOUND === 'true';
    if (isStaging) {
      this.logger.warn(`🛡️ [SAFETY NET] Đang chạy trong môi trường STAGING (hoặc SAFETY_NET_DISABLE_OUTBOUND=true). Chặn gửi SMS thật tới ${phone}.`);
      this.logger.log(`[STAGING MOCK SMS] Gửi OTP tới ${phone}: ${code} (chỉ ghi log nội bộ)`);
      return;
    }

    const provider = process.env.SMS_PROVIDER ?? 'mock';

    if (provider === 'mock') {
      if (process.env.NODE_ENV === 'production') {
        throw new HttpException('Chế độ SMS mock không được phép chạy ở môi trường production.', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      this.logger.warn(`[MOCK SMS] Gửi OTP tới ${phone}: ${code} (chỉ hiện trong log dev/test)`);
      return;
    }

    // P0-06 / BE-01: Tích hợp adapter nhà mạng SMS thật với AbortSignal timeout 5s
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
            Content: `Ma xac thuc Thue Tro Nhanh cua ban la: ${code}. Hieu luc 5 phut.`,
            SmsType: '2', // CSKH / OTP
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) {
          throw new Error(`eSMS trả mã HTTP lỗi: ${res.status}`);
        }
        const data: any = await res.json();
        if (data.CodeResult !== '100') {
          throw new Error(`eSMS từ chối gửi tin (CodeResult=${data.CodeResult}, ErrorMessage=${data.ErrorMessage})`);
        }
        this.logger.log(`[eSMS] Đã phát OTP thành công tới ${phone}`);
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
        params.set('Body', `Ma xac thuc Thue Tro Nhanh cua ban la: ${code}. Hieu luc 5 phut.`);

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

        if (!res.ok) {
          throw new Error(`Twilio trả mã HTTP lỗi: ${res.status}`);
        }
        this.logger.log(`[Twilio] Đã phát OTP thành công tới ${phone}`);
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
            content: `Ma xac thuc Thue Tro Nhanh cua ban la: ${code}. Hieu luc 5 phut.`,
            sms_type: 2,
          }),
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!res.ok) throw new Error(`SpeedSMS trả mã HTTP lỗi: ${res.status}`);
        this.logger.log(`[SpeedSMS] Đã phát OTP thành công tới ${phone}`);
        return;
      }

      throw new Error(`SMS_PROVIDER="${provider}" không được hỗ trợ.`);
    } catch (err: any) {
      this.logger.error(`Lỗi khi gửi SMS OTP qua provider "${provider}": ${err.message}`);
      throw new HttpException(
        'Không thể gửi mã xác thực SMS qua nhà mạng viễn thông. Vui lòng kiểm tra lại số điện thoại hoặc thử lại sau ít phút.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /** Dọn dẹp các bản ghi OTP đã hết hạn khỏi bộ nhớ */
  cleanupExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [phone, record] of this.store.entries()) {
      if (now > record.expiresAt && now - record.windowStart >= 60 * 60 * 1000) {
        this.store.delete(phone);
        count++;
      }
    }
    return count;
  }
}


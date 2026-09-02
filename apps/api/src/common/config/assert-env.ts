/**
 * assert-env.ts — kiểm tra các biến môi trường bảo mật cốt lõi TRƯỚC khi ứng dụng khởi động.
 *
 * PHÁT HIỆN TRONG ĐỢT AUDIT ĐỘC LẬP (kiểm tra bởi Claude, 01/09/2026):
 * `auth.service.ts` và `jwt.strategy.ts` trước đây dùng pattern
 * `process.env.JWT_ACCESS_SECRET ?? 'changeme_access'` — nghĩa là nếu file .env bị thiếu, đặt
 * sai đường dẫn, hoặc chỉ đơn giản là quên điền, ứng dụng vẫn KHỞI ĐỘNG BÌNH THƯỜNG và ký JWT
 * bằng một chuỗi placeholder CỐ ĐỊNH, in rõ ràng trong mã nguồn công khai trên GitHub
 * (`'changeme_access'` / `'changeme_refresh'`, trùng khớp giá trị mẫu trong `.env.example`).
 *
 * Hậu quả: BẤT KỲ AI đọc được repo (kể cả public) đều có thể tự ký một JWT hợp lệ với
 * payload `{ sub: '1', phone: '...', role: 'admin' }` bằng secret đã biết trước, giả mạo
 * hoàn toàn danh tính bất kỳ user/admin nào — vượt qua toàn bộ lớp xác thực mà không cần
 * mật khẩu hay OTP. Đây là lỗ hổng nghiêm trọng nhất tìm được trong đợt audit này.
 *
 * Cách sửa: bắt buộc secret phải được set; nếu vẫn còn là giá trị placeholder mặc định thì
 * CHẶN KHỞI ĐỘNG hoàn toàn ở môi trường production, chỉ cảnh báo (không chặn) ở dev/test để
 * không phá vỡ trải nghiệm phát triển cục bộ khi chưa cấu hình secret thật.
 */

const INSECURE_DEFAULTS: Record<string, string> = {
  JWT_ACCESS_SECRET: 'changeme_access',
  JWT_REFRESH_SECRET: 'changeme_refresh',
};

export function assertRequiredSecrets(): void {
  const isProduction = process.env.NODE_ENV === 'production';

  for (const [key, insecureValue] of Object.entries(INSECURE_DEFAULTS)) {
    const value = process.env[key];

    if (!value) {
      throw new Error(
        `[Cấu hình thiếu] Biến môi trường ${key} chưa được thiết lập.\n` +
          `→ Tạo file ".env" ở gốc monorepo (copy từ ".env.example") và điền giá trị thật, ` +
          `rồi khởi động lại. Ứng dụng KHÔNG được phép chạy khi thiếu secret ký JWT.`,
      );
    }

    if (value === insecureValue) {
      if (isProduction) {
        throw new Error(
          `[BẢO MẬT NGHIÊM TRỌNG] ${key} vẫn đang dùng giá trị placeholder mặc định ` +
            `"${insecureValue}" trong môi trường production (NODE_ENV=production).\n` +
            `→ Đây là lỗ hổng cho phép giả mạo JWT của bất kỳ ai. Sinh giá trị ngẫu nhiên đủ mạnh ` +
            `(ví dụ: chạy "openssl rand -hex 32") và điền vào biến ${key} trong .env thật trước khi deploy. ` +
            `Ứng dụng sẽ KHÔNG khởi động cho tới khi được sửa.`,
        );
      }
      // eslint-disable-next-line no-console
      console.warn(
        `⚠️  [CHỈ CHẤP NHẬN Ở DEV] ${key} đang dùng giá trị placeholder mặc định "${insecureValue}". ` +
          `Việc này CHỈ được phép ở môi trường development/test. TUYỆT ĐỐI không deploy production ` +
          `khi biến này chưa được đổi sang giá trị bí mật thật.`,
      );
    }
  }

  // BẢO MẬT & VẬN HÀNH (#34): Trong môi trường production, KHÔNG được phép dùng mock SMS
  if (isProduction && (!process.env.SMS_PROVIDER || process.env.SMS_PROVIDER === 'mock')) {
    throw new Error(
      `[CẤU HÌNH PRODUCTION KHÔNG HỢP LỆ] SMS_PROVIDER đang đặt là "${process.env.SMS_PROVIDER ?? 'chưa có'}" (chế độ mock).\n` +
        `→ Trong môi trường production (NODE_ENV=production), KHÔNG được phép dùng mock SMS vì người dùng thật không thể nhận được OTP.\n` +
        `Vui lòng cấu hình tài khoản SMS thật (esms, speedsms, twilio...) và API key tương ứng trong .env trước khi khởi động.`,
    );
  }
}

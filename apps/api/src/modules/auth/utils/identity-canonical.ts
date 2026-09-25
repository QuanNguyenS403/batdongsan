/**
 * Tiện ích chuẩn hóa Định danh người dùng (Identity Canonicalization)
 * Tuân thủ KT-01, KT-02, KT-03 theo Kế hoạch điều chỉnh V2
 */

/**
 * Chuẩn hóa địa chỉ Email theo quy tắc của nhà cung cấp dịch vụ (KT-02):
 * - Đối với Gmail cá nhân (@gmail.com, @googlemail.com):
 *   + Dấu chấm (.) trong tên người dùng KHÔNG có ý nghĩa (john.doe == johndoe)
 *   + Phần mở rộng (+) được loại bỏ (john.doe+test@gmail.com == johndoe@gmail.com)
 *   + Tên miền googlemail.com được quy về gmail.com
 * - Đối với Google Workspace / Tên miền doanh nghiệp, tổ chức (@company.com, @edu.vn):
 *   + TUYỆT ĐỐI KHÔNG xóa dấu chấm trong tên người dùng (KT-02)
 *   + Giữ nguyên cấu trúc định danh của tổ chức
 */
export function canonicalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  let local = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }

  if (domain === 'gmail.com') {
    // Gmail: bỏ tất cả dấu chấm
    local = local.replace(/\./g, '');
    // Gmail: bỏ phần sau dấu +
    const plusIndex = local.indexOf('+');
    if (plusIndex !== -1) {
      local = local.slice(0, plusIndex);
    }
    return `${local}@gmail.com`;
  }

  // Tên miền tổ chức / Google Workspace: giữ nguyên dấu chấm trong local part (KT-02)
  return `${local}@${domain}`;
}

/**
 * Chuẩn hóa số điện thoại di động Việt Nam về chuẩn quốc tế E.164 (+84...):
 * - Hỗ trợ đầu số 0, 84 hoặc +84
 * - Loại bỏ khoảng trắng, dấu gạch ngang, dấu chấm
 * - Định dạng đầu ra: +84[3|5|7|8|9]xxxxxxxx (12 ký tự)
 * - Trả về null nếu số không đúng định dạng số di động hợp lệ
 */
export function canonicalizePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;

  let clean = phone.replace(/[\s\-\.\(\)]/g, '');

  if (clean.startsWith('+84')) {
    clean = clean.slice(3);
  } else if (clean.startsWith('84') && clean.length === 11) {
    clean = clean.slice(2);
  } else if (clean.startsWith('0') && clean.length === 10) {
    clean = clean.slice(1);
  } else {
    return null;
  }

  // Đầu số di động Việt Nam hợp lệ: 3, 5, 7, 8, 9 và theo sau bởi 8 chữ số
  if (!/^[35789][0-9]{8}$/.test(clean)) {
    return null;
  }

  return `+84${clean}`;
}

/**
 * Kiểm tra định dạng số điện thoại di động hợp lệ tại Việt Nam
 */
export function isValidVietnamPhone(phone: string): boolean {
  return canonicalizePhone(phone) !== null;
}

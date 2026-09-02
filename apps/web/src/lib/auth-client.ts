/**
 * auth-client.ts — fetch có gắn sẵn Bearer accessToken, tự động thử làm mới token khi hết hạn.
 *
 * PHÁT HIỆN QUA AUDIT ĐỘC LẬP (01/09/2026): backend đã có endpoint `POST /auth/refresh` (được
 * thêm ở đợt sửa trước) và `dang-nhap/page.tsx` đã lưu cả `accessToken` lẫn `refreshToken` vào
 * localStorage sau khi đăng nhập — NHƯNG không có bất kỳ đoạn code frontend nào thực sự GỌI
 * `/auth/refresh`. Với `JWT_ACCESS_EXPIRES_IN=15m` (mặc định trong .env.example), hậu quả là:
 * cứ sau 15 phút hoạt động, MỌI request cần xác thực (bấm hiện số điện thoại, đăng tin, kiểm
 * tra trạng thái đăng nhập ở Header...) đều nhận 401 — và `Header.tsx` coi 401 ở `/auth/me` là
 * "chưa đăng nhập" rồi tự xoá token — nghĩa là người dùng bị ĐĂNG XUẤT ÂM THẦM sau mỗi 15 phút
 * dù `refreshToken` (hạn 7 ngày) vẫn còn hoàn toàn hợp lệ. Đây là lỗi ảnh hưởng trải nghiệm
 * nghiêm trọng trên một trang có phiên duyệt web thường kéo dài hơn 15 phút.
 *
 * Hàm `authFetch` bên dưới thay thế mọi chỗ đang tự đọc localStorage + gọi fetch thủ công —
 * khi gặp 401, tự thử `/auth/refresh` MỘT lần bằng refreshToken đang lưu, cập nhật lại token
 * mới, rồi gọi lại request gốc; chỉ khi refresh cũng thất bại mới thực sự coi là hết phiên.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function getAccessToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}

function getRefreshToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

/** Gọi /auth/refresh bằng refreshToken hiện có. Trả về accessToken mới, hoặc null nếu thất bại. */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

/**
 * fetch có Bearer token, tự retry 1 lần sau khi refresh nếu gặp 401.
 * Dùng thay cho fetch() thủ công ở MỌI nơi cần gọi API đã đăng nhập từ Client Component.
 */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await doFetch(getAccessToken());

  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      res = await doFetch(newToken);
    } else {
      // refreshToken cũng không còn dùng được nữa (hết hạn 7 ngày, hoặc bị thu hồi) —
      // đây mới thực sự là lúc coi như hết phiên đăng nhập.
      clearTokens();
    }
  }

  return res;
}

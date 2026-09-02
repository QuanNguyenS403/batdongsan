'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

/**
 * Trang đăng tin — phiên bản MVP 1 bước (form đơn), CHƯA phải wizard nhiều bước
 * như mô tả trong CLAUDE.md § 1.10. Bản hoàn thiện nên tách thành nhiều bước
 * (chọn loại hình → địa chỉ → chi tiết → ảnh → xem lại) để giảm bounce rate,
 * nhưng cấu trúc dữ liệu gửi lên API (CreateListingDto) đã đúng chuẩn cuối cùng.
 */
export default function DangTinPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isLoggedIn()) {
      setError('Vui lòng đăng nhập trước khi đăng tin.');
      return;
    }

    const form = new FormData(e.currentTarget);
    const payload = {
      transactionType: form.get('transactionType'),
      propertyType: form.get('propertyType'),
      locationId: Number(form.get('locationId')),
      title: form.get('title'),
      description: form.get('description'),
      price: Number(form.get('price')),
      areaM2: Number(form.get('areaM2')),
      bedrooms: form.get('bedrooms') ? Number(form.get('bedrooms')) : undefined,
      bathrooms: form.get('bathrooms') ? Number(form.get('bathrooms')) : undefined,
      legalStatus: form.get('legalStatus') || undefined,
      addressDetail: form.get('addressDetail') || undefined,
    };

    setLoading(true);
    try {
      const res = await authFetch('/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message?.toString() ?? 'Đăng tin thất bại.');

      setMessage('success');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Đăng tin bất động sản</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tin đăng sẽ ở trạng thái <b>chờ duyệt</b> cho tới khi quản trị viên xác nhận (xem module Admin).
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <select name="transactionType" required className="rounded-lg border px-3 py-2 text-sm">
            <option value="sale">Bán</option>
            <option value="rent">Cho thuê</option>
          </select>
          <select name="propertyType" required className="rounded-lg border px-3 py-2 text-sm">
            <option value="can-ho">Căn hộ</option>
            <option value="nha-nguyen-can">Nhà nguyên căn</option>
            <option value="dat">Đất</option>
            <option value="shophouse">Shophouse</option>
            <option value="phong-tro">Phòng trọ</option>
          </select>
        </div>

        <input name="locationId" required type="number" placeholder="Mã khu vực (locationId — GET /locations)" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="title" required minLength={10} placeholder="Tiêu đề tin đăng" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <textarea name="description" placeholder="Mô tả chi tiết" rows={4} className="w-full rounded-lg border px-3 py-2 text-sm" />

        <div className="grid grid-cols-2 gap-4">
          <input name="price" required type="number" placeholder="Giá (VNĐ)" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="areaM2" required type="number" step="0.1" placeholder="Diện tích (m²)" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="bedrooms" type="number" placeholder="Số phòng ngủ" className="rounded-lg border px-3 py-2 text-sm" />
          <input name="bathrooms" type="number" placeholder="Số phòng tắm" className="rounded-lg border px-3 py-2 text-sm" />
        </div>

        <select name="legalStatus" className="w-full rounded-lg border px-3 py-2 text-sm">
          <option value="">-- Pháp lý --</option>
          <option value="so_do">Sổ đỏ</option>
          <option value="so_hong">Sổ hồng</option>
          <option value="hop_dong">Hợp đồng mua bán</option>
          <option value="dang_cho_so">Đang chờ sổ</option>
        </select>

        <input name="addressDetail" placeholder="Địa chỉ chi tiết" className="w-full rounded-lg border px-3 py-2 text-sm" />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? 'Đang đăng...' : 'Đăng tin'}
        </button>

        {message === 'success' && (
          <p className="text-sm text-green-700">
            Đăng tin thành công! Tin của bạn đang <b>chờ duyệt</b> trước khi hiển thị công khai. Theo dõi trạng thái
            tại{' '}
            <Link href="/tai-khoan/quan-ly-tin" className="font-semibold underline">
              trang Quản lý tin
            </Link>
            .
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}

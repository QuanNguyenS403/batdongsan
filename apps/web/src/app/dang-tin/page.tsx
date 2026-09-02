'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

interface LocationItem {
  id: number;
  name: string;
  level: string;
  slug: string;
  parentId: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function DangTinPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    // Tải danh sách địa danh để người dùng chọn dropdown thay vì phải tự gõ ID số thô
    fetch(`${API_URL}/locations`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLocations(data))
      .catch(() => setLocations([]));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setUploadStatus(null);

    if (!isLoggedIn()) {
      setError('Vui lòng đăng nhập trước khi đăng tin.');
      return;
    }

    const form = new FormData(e.currentTarget);
    const locationIdValue = form.get('locationId');
    if (!locationIdValue) {
      setError('Vui lòng chọn khu vực bất động sản.');
      return;
    }

    const payload = {
      transactionType: form.get('transactionType'),
      propertyType: form.get('propertyType'),
      locationId: Number(locationIdValue),
      title: form.get('title'),
      description: form.get('description'),
      price: Number(form.get('price')),
      areaM2: Number(form.get('areaM2')),
      bedrooms: form.get('bedrooms') ? Number(form.get('bedrooms')) : undefined,
      bathrooms: form.get('bathrooms') ? Number(form.get('bathrooms')) : undefined,
      legalStatus: form.get('legalStatus') || undefined,
      addressDetail: form.get('addressDetail') || undefined,
    };

    const imageFiles = form.getAll('images') as File[];
    const validImageFiles = imageFiles.filter((f) => f && f.size > 0);

    setLoading(true);
    try {
      // 1. Tạo tin đăng
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

      // 2. Upload ảnh đính kèm nếu có
      if (validImageFiles.length > 0) {
        setUploadStatus(`Đang tải lên ${validImageFiles.length} hình ảnh...`);
        const imgFormData = new FormData();
        validImageFiles.forEach((file) => {
          imgFormData.append('files', file);
        });

        const imgRes = await authFetch(`/listings/${data.id}/images`, {
          method: 'POST',
          body: imgFormData,
          // Không set Content-Type header để browser tự sinh multipart/form-data boundary
        });

        if (!imgRes.ok) {
          const imgErr = await imgRes.json();
          setUploadStatus(`Tin đã tạo nhưng không upload được ảnh: ${imgErr.message ?? 'Lỗi không xác định'}`);
        } else {
          setUploadStatus(`Đã tải lên thành công ${validImageFiles.length} ảnh.`);
        }
      }

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Đăng tin bất động sản</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tin đăng sau khi tạo sẽ ở trạng thái <b className="text-amber-600">chờ duyệt</b> trước khi hiển thị công khai trên sàn giao dịch.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-surface-border bg-white p-7 shadow-elevated">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Hình thức giao dịch *</label>
            <select name="transactionType" required className="input-field">
              <option value="sale">Mua bán</option>
              <option value="rent">Cho thuê</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Loại bất động sản *</label>
            <select name="propertyType" required className="input-field">
              <option value="can-ho">Căn hộ / Chung cư</option>
              <option value="nha-nguyen-can">Nhà riêng / Nhà phố</option>
              <option value="dat">Đất nền</option>
              <option value="shophouse">Shophouse</option>
              <option value="phong-tro">Phòng trọ</option>
            </select>
          </div>
        </div>

        {/* Chọn khu vực địa danh */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Khu vực (Tỉnh/Quận/Phường) *</label>
          <select name="locationId" required className="input-field">
            <option value="">-- Chọn khu vực --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.level === 'province' ? `📍 ${loc.name}` : loc.level === 'district' ? `  └─ ${loc.name}` : `     └─ ${loc.name}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Tiêu đề tin đăng *</label>
          <input
            name="title"
            required
            minLength={10}
            placeholder="VD: Căn hộ 2PN view sông tại Quận 7, đầy đủ nội thất"
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Mô tả chi tiết</label>
          <textarea
            name="description"
            placeholder="Mô tả thông tin chi tiết về bất động sản, tiện ích xung quanh, hướng nhà..."
            rows={4}
            className="input-field resize-y"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Giá (VNĐ) *</label>
            <input
              name="price"
              required
              type="number"
              placeholder="VD: 3500000000"
              className="input-field"
            />
            <p className="mt-1 text-[11px] text-text-muted">
              Nhập số nguyên (VNĐ) — VD: 3500000000 = 3 tỷ 500 triệu
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Diện tích (m²) *</label>
            <input
              name="areaM2"
              required
              type="number"
              step="0.1"
              placeholder="VD: 75.5"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Số phòng ngủ</label>
            <input
              name="bedrooms"
              type="number"
              placeholder="VD: 2"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Số phòng tắm</label>
            <input
              name="bathrooms"
              type="number"
              placeholder="VD: 2"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Pháp lý</label>
            <select name="legalStatus" className="input-field">
              <option value="">-- Chưa xác định --</option>
              <option value="so_do">Sổ đỏ</option>
              <option value="so_hong">Sổ hồng</option>
              <option value="hop_dong">Hợp đồng mua bán</option>
              <option value="dang_cho_so">Đang chờ sổ</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Địa chỉ cụ thể</label>
            <input
              name="addressDetail"
              placeholder="Số nhà, tên đường, toà nhà..."
              className="input-field"
            />
          </div>
        </div>

        {/* Upload hình ảnh */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Hình ảnh bất động sản (Tối đa 20 ảnh, JPG/PNG/WEBP, tối đa 10MB/ảnh)
          </label>
          <input
            name="images"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="w-full rounded-xl border border-dashed border-surface-border bg-slate-50/60 p-3 text-sm text-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Đang xử lý...' : 'Đăng tin ngay'}
        </button>

        {uploadStatus && <p className="text-xs text-brand font-medium">{uploadStatus}</p>}

        {message === 'success' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">✓ Đăng tin thành công!</p>
            <p className="mt-1 text-xs leading-relaxed">
              Tin của bạn đang ở trạng thái <b>chờ duyệt</b>. Bạn có thể theo dõi trạng thái
              và quản lý tin tại{' '}
              <Link href="/tai-khoan/quan-ly-tin" className="font-bold underline text-brand-700">
                trang Quản lý tin
              </Link>
              .
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

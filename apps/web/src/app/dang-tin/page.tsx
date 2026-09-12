'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, isLoggedIn } from '@/lib/auth-client';
import { AuthModal } from '@/components/AuthModal';

interface LocationItem {
  id: number;
  name: string;
  level: string;
  slug: string;
  parentId: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface PropertyGroup {
  groupName: string;
  items: { value: string; label: string }[];
}

const PROPERTY_TYPE_GROUPS: PropertyGroup[] = [
  {
    groupName: '🏢 Căn hộ',
    items: [
      { value: 'can-ho-chung-cu', label: 'Căn hộ chung cư' },
      { value: 'can-ho-mini', label: 'Căn hộ mini' },
      { value: 'can-ho-dich-vu', label: 'Căn hộ dịch vụ' },
      { value: 'can-ho-cao-cap', label: 'Căn hộ cao cấp' },
    ],
  },
  {
    groupName: '🛋️ Studio',
    items: [
      { value: 'studio', label: 'Studio tiêu chuẩn' },
      { value: 'studio-ban-cong', label: 'Studio ban công' },
      { value: 'studio-gac-lung', label: 'Studio gác lửng' },
      { value: 'studio-full-noi-that', label: 'Studio full nội thất' },
    ],
  },
  {
    groupName: '🛏️ Phòng trọ & Mặt bằng',
    items: [
      { value: 'phong-tro-sinh-vien', label: 'Phòng trọ sinh viên' },
      { value: 'phong-tro-nguoi-di-lam', label: 'Phòng trọ người đi làm' },
      { value: 'ky-tuc-xa-tu-nhan', label: 'Ký túc xá / Sleepbox' },
      { value: 'nha-nguyen-can', label: 'Nhà nguyên căn' },
      { value: 'mat-bang-kinh-doanh', label: 'Mặt bằng kinh doanh' },
    ],
  },
];

export default function DangTinPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [propertyType, setPropertyType] = useState('can-ho-chung-cu');
  const [loggedInUser, setLoggedInUser] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Quản lý hình ảnh và xem trước
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  useEffect(() => {
    setLoggedInUser(isLoggedIn());

    // Tải danh sách địa danh
    fetch(`${API_URL}/locations`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLocations(data))
      .catch(() => setLocations([]));
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  }

  function handleRemoveFile(index: number) {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setUploadStatus(null);

    if (!isLoggedIn()) {
      setAuthModalOpen(true);
      return;
    }

    const form = new FormData(e.currentTarget);
    const locationIdValue = form.get('locationId');
    if (!locationIdValue) {
      setError('Vui lòng chọn khu vực bất động sản cho thuê.');
      return;
    }

    const payload = {
      transactionType: 'rent',
      propertyType,
      locationId: Number(locationIdValue),
      addressDetail: (form.get('addressDetail') as string) || undefined,
      title: form.get('title') as string,
      description: (form.get('description') as string) || undefined,
      price: Number(form.get('price')),
      depositAmount: form.get('depositAmount') ? Number(form.get('depositAmount')) : undefined,
      minLeaseMonths: form.get('minLeaseMonths') ? Number(form.get('minLeaseMonths')) : undefined,
      areaM2: Number(form.get('areaM2')),
      bedrooms: form.get('bedrooms') ? Number(form.get('bedrooms')) : undefined,
      bathrooms: form.get('bathrooms') ? Number(form.get('bathrooms')) : undefined,
    };

    setLoading(true);
    try {
      const res = await authFetch('/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Đăng tin thất bại, vui lòng kiểm tra lại thông tin.');
      }

      const newListing = await res.json();

      // FE-06: Upload ảnh trực tiếp qua FormData tới API /listings/:id/images
      if (selectedFiles.length > 0 && newListing?.id) {
        setUploadStatus(`Đang tải lên ${selectedFiles.length} ảnh thực tế...`);
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        const imgRes = await authFetch(`/listings/${newListing.id}/images`, {
          method: 'POST',
          body: formData,
        });

        if (!imgRes.ok) {
          const errData = await imgRes.json().catch(() => ({}));
          throw new Error(
            `Tin đăng #${newListing.id} đã được tạo thành công, nhưng tải ảnh lên bị lỗi: ${errData.message ?? 'Không thể tải ảnh'}. Vui lòng vào trang "Quản lý tin" để thêm ảnh bổ sung.`,
          );
        }
      }

      setMessage('success');
      setSelectedFiles([]);
      setPreviewUrls([]);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-2">
          🔑 Nền tảng chuyên biệt cho thuê
        </span>
        <h1 className="text-2xl font-bold text-text-primary">Đăng tin cho thuê Căn hộ, Studio & Phòng trọ</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tiếp cận hàng ngàn khách thuê có nhu cầu thực tế. Tin đăng được kiểm duyệt nhanh chóng.
        </p>
      </div>

      {/* Cảnh báo bắt buộc đăng nhập nếu chưa đăng nhập */}
      {!loggedInUser && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔒</span>
            <p className="text-xs sm:text-sm font-medium text-amber-900">
              Bạn cần <strong>đăng nhập</strong> bằng số điện thoại để đăng tin cho thuê.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white transition-colors shrink-0 shadow-sm"
          >
            Đăng nhập ngay
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-surface-border bg-white p-7 shadow-elevated">
        {/* Loại hình cho thuê — Phân chia rõ ràng Căn hộ và Studio riêng biệt */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-text-secondary">
            Loại hình cho thuê * (Chọn đúng chuyên mục)
          </label>
          <div className="space-y-3">
            {PROPERTY_TYPE_GROUPS.map((group) => (
              <div key={group.groupName} className="rounded-xl border border-surface-border bg-slate-50/50 p-3">
                <p className="mb-2 text-xs font-bold text-text-primary">{group.groupName}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {group.items.map((pt) => (
                    <button
                      key={pt.value}
                      type="button"
                      onClick={() => setPropertyType(pt.value)}
                      className={`flex items-center justify-center p-2.5 rounded-lg border text-xs text-center transition-all ${
                        propertyType === pt.value
                          ? 'border-brand bg-brand text-white font-bold shadow-sm'
                          : 'border-surface-border bg-white text-text-secondary hover:border-brand/40'
                      }`}
                    >
                      <span>{pt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Địa danh & Khu vực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Khu vực (Tỉnh/Quận/Huyện) *</label>
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
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Địa chỉ cụ thể (Số nhà, ngõ, tên đường)</label>
            <input
              name="addressDetail"
              placeholder="VD: Số 45/12 đường D1, Phường Tân Phong"
              className="input-field"
            />
          </div>
        </div>

        {/* Tiêu đề & Mô tả */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Tiêu đề tin đăng *</label>
          <input
            name="title"
            required
            minLength={10}
            placeholder="VD: Cho thuê căn hộ 2PN view thoáng, ban công rộng, đầy đủ nội thất"
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Mô tả chi tiết</label>
          <textarea
            name="description"
            placeholder="Mô tả về phòng, đồ đạc có sẵn, lối đi riêng, giờ giấc, an ninh, tiện ích xung quanh (chợ, siêu thị, bến xe buýt)..."
            rows={4}
            className="input-field resize-y"
          />
        </div>

        {/* Giá thuê & Thông số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Giá thuê / tháng (VNĐ) *</label>
            <input
              name="price"
              required
              type="number"
              placeholder="VD: 3500000"
              className="input-field"
            />
            <p className="mt-1 text-[11px] text-text-muted">Nhập số nguyên VNĐ — VD: 3500000</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Tiền đặt cọc (VNĐ)</label>
            <input
              name="depositAmount"
              type="number"
              placeholder="VD: 3500000"
              className="input-field"
            />
            <p className="mt-1 text-[11px] text-text-muted">Thường bằng 1 tháng tiền thuê</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Hợp đồng tối thiểu (tháng)</label>
            <input
              name="minLeaseMonths"
              type="number"
              placeholder="VD: 6 hoặc 12"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Diện tích sử dụng (m²) *</label>
            <input
              name="areaM2"
              required
              type="number"
              step="0.1"
              placeholder="VD: 30"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Số phòng ngủ</label>
            <input
              name="bedrooms"
              type="number"
              placeholder="VD: 1"
              defaultValue={1}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Số phòng tắm / WC</label>
            <input
              name="bathrooms"
              type="number"
              placeholder="VD: 1"
              defaultValue={1}
              className="input-field"
            />
          </div>
        </div>

        {/* Upload hình ảnh */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Hình ảnh thực tế (Tối đa 20 ảnh, JPG/PNG/WEBP)
          </label>
          <input
            name="images"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="w-full rounded-xl border border-dashed border-surface-border bg-slate-50/60 p-3 text-sm text-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700 transition-colors"
          />

          {/* Thumbnail preview */}
          {previewUrls.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-text-secondary mb-2">
                Đã chọn {previewUrls.length} ảnh xem trước:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-surface-border aspect-square bg-slate-100 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {uploadStatus && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 flex items-center gap-2">
            <span className="animate-spin text-sm">⏳</span>
            <span>{uploadStatus}</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {message === 'success' && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold">
              ✓
            </div>
            <p className="font-bold text-emerald-800">Đăng tin thành công!</p>
            <p className="mt-1 text-xs text-emerald-600">
              Tin của bạn đang được kiểm duyệt tự động và sẽ hiển thị công khai sớm.
            </p>
            <div className="mt-3 flex justify-center gap-3">
              <Link href="/thue" className="btn-secondary text-xs">
                Xem danh sách tin
              </Link>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base justify-center font-bold"
          >
            {loading ? 'Đang gửi tin...' : 'Đăng tin ngay'}
          </button>
        </div>
      </form>

      {/* Modal đăng ký / đăng nhập */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setLoggedInUser(true)}
        subtitle="Đăng nhập để đăng tin cho thuê phòng / căn hộ"
      />
    </div>
  );
}

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-brand/10 text-3xl text-brand mb-6 ring-1 ring-brand/20">
          🏡
        </div>
        <h1 className="text-3xl font-bold text-text-primary">Không tìm thấy trang</h1>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          Bất động sản hoặc trang bạn đang tìm kiếm không tồn tại, đã bị gỡ bỏ hoặc địa chỉ liên kết không chính xác.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary w-full sm:w-auto">
            ← Về trang chủ
          </Link>
          <Link href="/thue" className="btn-secondary w-full sm:w-auto">
            Tìm phòng cho thuê
          </Link>
        </div>
      </div>
    </div>
  );
}

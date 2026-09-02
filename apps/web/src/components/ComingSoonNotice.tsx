import Link from 'next/link';

/**
 * PHÁT HIỆN QUA AUDIT (01/09/2026): Header.tsx liên kết tới /du-an, /moi-gioi, /gia-nha-dat,
 * /tai-khoan/tin-da-luu, /tai-khoan/thong-tin — nhưng KHÔNG MỘT route nào trong số này thực sự
 * tồn tại trong app/, khiến toàn bộ 5 mục điều hướng đó dẫn tới trang 404 mặc định của Next.js
 * trên MỌI trang của site (vì Header dùng chung toàn site). `next build` không bắt được lỗi này
 * vì Next.js không validate đường dẫn trong <Link href> tại build time.
 *
 * Đây KHÔNG phải bản build đầy đủ các tính năng đó (Dự án/Môi giới/Giá nhà đất/BĐS đã lưu/
 * Thông tin tài khoản vẫn là công việc roadmap Giai đoạn 2-3 theo README.md mục 15) — chỉ là
 * bản vá TÍNH NHẤT QUÁN ĐIỀU HƯỚNG: không còn dead link, người dùng biết rõ tính năng nào đã
 * có và tính năng nào đang chờ, thay vì gặp lỗi 404 khó hiểu.
 */
export function ComingSoonNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/20 text-2xl">
        🚧
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500">{description}</p>
      <p className="mt-1 text-sm text-gray-400">Tính năng này đang được phát triển và sẽ sớm ra mắt.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/mua-ban" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark">
          Xem tin mua bán
        </Link>
        <Link href="/thue" className="rounded-full border px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Xem tin cho thuê
        </Link>
      </div>
    </div>
  );
}

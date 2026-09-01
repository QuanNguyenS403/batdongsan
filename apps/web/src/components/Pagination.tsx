import Link from 'next/link';

interface Props {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}

/**
 * Trước đây API đã trả đủ `pagination.totalPages` nhưng KHÔNG có component nào hiển thị —
 * người dùng bị kẹt ở trang 1, không cách nào xem tin ở trang 2 trở đi dù dữ liệu có tồn tại.
 * Đây là thiếu sót chức năng thật, không phải tối ưu thêm.
 */
export function Pagination({ currentPage, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, value);
    });
    params.set('page', String(page));
    return `${basePath}?${params.toString()}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2,
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1 text-sm">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`rounded px-3 py-1.5 ${currentPage === 1 ? 'pointer-events-none text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        ‹ Trước
      </Link>

      {pages.map((page, idx) => (
        <span key={page} className="flex items-center">
          {idx > 0 && pages[idx - 1] !== page - 1 && <span className="px-1 text-gray-400">…</span>}
          <Link
            href={buildHref(page)}
            className={`rounded px-3 py-1.5 ${
              page === currentPage ? 'bg-brand font-semibold text-gray-900' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page}
          </Link>
        </span>
      ))}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`rounded px-3 py-1.5 ${currentPage === totalPages ? 'pointer-events-none text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        Sau ›
      </Link>
    </nav>
  );
}

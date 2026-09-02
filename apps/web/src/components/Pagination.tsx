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
        className={`flex items-center gap-1 rounded-xl px-3.5 py-2 font-medium transition-colors ${
          currentPage === 1
            ? 'pointer-events-none text-text-muted'
            : 'text-text-secondary hover:bg-white hover:text-brand'
        }`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Trước
      </Link>

      {pages.map((page, idx) => (
        <span key={page} className="flex items-center">
          {idx > 0 && pages[idx - 1] !== page - 1 && (
            <span className="px-2 text-text-muted">…</span>
          )}
          <Link
            href={buildHref(page)}
            className={`min-w-[2.5rem] rounded-xl px-3 py-2 text-center font-medium transition-colors ${
              page === currentPage
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:bg-white hover:text-brand'
            }`}
          >
            {page}
          </Link>
        </span>
      ))}

      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`flex items-center gap-1 rounded-xl px-3.5 py-2 font-medium transition-colors ${
          currentPage === totalPages
            ? 'pointer-events-none text-text-muted'
            : 'text-text-secondary hover:bg-white hover:text-brand'
        }`}
      >
        Tiếp
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>
    </nav>
  );
}

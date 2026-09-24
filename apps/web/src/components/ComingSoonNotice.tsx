interface Props {
  title: string;
  description: string;
}

export function ComingSoonNotice({ title, description }: Props) {
  return (
    <div className="min-h-[60vh] bg-surface-muted">
      <div className="container-max py-16">
        <div className="mx-auto max-w-lg text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
            <svg
              className="h-10 w-10 text-brand"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Badge */}
          <div className="mb-4 inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/20">
            Sắp ra mắt
          </div>

          <h1 className="text-2xl font-bold text-text-primary md:text-3xl">{title}</h1>
          <p className="mt-3 text-text-secondary leading-relaxed">{description}</p>

          <div className="mt-8 rounded-2xl border border-surface-border bg-white p-5 text-left shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Tính năng đang trong lộ trình
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Chức năng này đang được phát triển theo lộ trình Giai đoạn 2-3. Trang hiện tại là
              placeholder trung thực — không có dữ liệu giả
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/"
              className="btn-secondary"
            >
              ← Trang chủ
            </a>
            <a
              href="/thue"
              className="btn-primary"
            >
              Xem phòng cho thuê
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-6">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-64 skeleton rounded" />
          <div className="h-4 w-24 skeleton rounded" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột trái (2/3 chiều rộng) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Gallery skeleton */}
            <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-card space-y-2">
              <div className="aspect-video w-full skeleton rounded-xl" />
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="aspect-square skeleton rounded-lg" />
                ))}
              </div>
            </div>

            {/* Tiêu đề & giá skeleton */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-3">
              <div className="h-6 w-24 skeleton rounded-full" />
              <div className="h-8 w-3/4 skeleton rounded-xl" />
              <div className="h-4 w-1/2 skeleton rounded" />
              <div className="h-9 w-44 skeleton rounded-lg pt-2" />
            </div>

            {/* Thông tin chính skeleton */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
              <div className="h-5 w-36 skeleton rounded-lg" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-16 skeleton rounded" />
                    <div className="h-5 w-24 skeleton rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Giới thiệu skeleton */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-3">
              <div className="h-5 w-24 skeleton rounded-lg" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-4/5 skeleton rounded" />
              <div className="pt-2 flex items-center gap-3">
                <div className="h-10 w-10 skeleton rounded-full" />
                <div className="space-y-1">
                  <div className="h-4 w-28 skeleton rounded" />
                  <div className="h-3 w-20 skeleton rounded" />
                </div>
              </div>
            </div>

            {/* Tiện ích xung quanh (Bản đồ) skeleton */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-3">
              <div className="h-5 w-36 skeleton rounded-lg" />
              <div className="aspect-[16/9] md:aspect-[21/9] w-full skeleton rounded-xl" />
            </div>

            {/* Bất động sản tương tự skeleton */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
              <div className="h-5 w-44 skeleton rounded-lg" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-surface-border space-y-2 pb-3">
                    <div className="aspect-[4/3] w-full skeleton" />
                    <div className="p-2 space-y-1.5">
                      <div className="h-3.5 w-full skeleton rounded" />
                      <div className="h-3 w-1/2 skeleton rounded" />
                      <div className="h-4 w-2/3 skeleton rounded pt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải — Sidebar skeleton (1/3 chiều rộng) */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 skeleton rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 skeleton rounded" />
                  <div className="h-3 w-20 skeleton rounded" />
                </div>
              </div>
              <div className="h-11 w-full skeleton rounded-xl" />
              <div className="h-10 w-full skeleton rounded-xl" />
              <div className="flex justify-between pt-2">
                <div className="h-9 w-24 skeleton rounded-full" />
                <div className="h-9 w-28 skeleton rounded-full" />
              </div>
            </div>
            <div className="h-36 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

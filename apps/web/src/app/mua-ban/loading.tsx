export default function MuaBanLoading() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-4 h-4 w-40 skeleton rounded" />

        {/* Title skeleton */}
        <div className="h-9 w-80 skeleton rounded-xl" />
        <div className="mt-2 h-4 w-32 skeleton rounded" />

        {/* SearchFilterBar skeleton */}
        <div className="mt-5 mb-6 rounded-2xl border border-surface-border bg-white p-4 shadow-card">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="h-10 skeleton rounded-xl lg:col-span-2" />
            <div className="h-10 skeleton rounded-xl" />
            <div className="h-10 skeleton rounded-xl" />
            <div className="h-10 skeleton rounded-xl" />
          </div>
          <div className="mt-3 flex justify-end border-t border-surface-border pt-3">
            <div className="h-8 w-28 skeleton rounded-full" />
          </div>
        </div>

        {/* Grid listing skeletons */}
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-white p-4 shadow-card space-y-3">
              <div className="aspect-[16/10] w-full skeleton rounded-xl" />
              <div className="flex items-center justify-between">
                <div className="h-6 w-1/3 skeleton rounded-lg" />
                <div className="h-4 w-16 skeleton rounded" />
              </div>
              <div className="h-5 w-full skeleton rounded-lg" />
              <div className="h-4 w-2/3 skeleton rounded" />
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <div className="h-4 w-14 skeleton rounded" />
                <div className="h-4 w-14 skeleton rounded" />
                <div className="h-4 w-14 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

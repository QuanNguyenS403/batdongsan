export default function RootLoading() {
  return (
    <div className="min-h-[70vh] bg-surface-muted py-10">
      <div className="container-max">
        {/* Shimmer header skeleton */}
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-7 w-48 skeleton rounded-full" />
          <div className="mx-auto h-12 w-3/4 skeleton rounded-2xl" />
          <div className="mx-auto h-5 w-1/2 skeleton rounded-xl" />
          <div className="mx-auto mt-8 h-14 w-full max-w-2xl skeleton rounded-2xl" />
        </div>

        {/* Feature cards skeleton */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>

        {/* Listings grid skeleton */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-60 skeleton rounded-xl" />
            <div className="h-5 w-24 skeleton rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white p-3 shadow-card space-y-3">
                <div className="aspect-[16/10] w-full skeleton rounded-xl" />
                <div className="h-5 w-1/2 skeleton rounded-lg" />
                <div className="h-5 w-full skeleton rounded-lg" />
                <div className="h-4 w-3/4 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

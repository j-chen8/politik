export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white rounded-2xl border border-border p-8 mb-6">
        <div className="flex gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-gray-200 rounded-lg w-64" />
            <div className="h-4 bg-gray-100 rounded w-96" />
            <div className="h-4 bg-gray-100 rounded w-48" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-5">
            <div className="h-4 bg-gray-100 rounded w-20 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-border p-6 h-64" />
        <div className="bg-white rounded-2xl border border-border p-6 h-64" />
      </div>
    </div>
  );
}

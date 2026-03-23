export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-6" />
      <div className="h-12 bg-gray-100 rounded-xl animate-pulse mb-3" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-14 bg-gray-200 rounded-2xl mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-border" />
        ))}
      </div>
    </div>
  );
}

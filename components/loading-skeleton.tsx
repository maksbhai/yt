export function LoadingSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="shimmer mb-4 h-6 w-1/3 rounded" />
      <div className="shimmer mb-3 h-4 w-full rounded" />
      <div className="shimmer mb-6 h-4 w-2/3 rounded" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="shimmer h-12 rounded-xl" />
        <div className="shimmer h-12 rounded-xl" />
      </div>
    </div>
  );
}

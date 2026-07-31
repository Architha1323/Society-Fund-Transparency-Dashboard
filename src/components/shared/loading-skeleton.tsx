export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="glass-panel h-14 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}

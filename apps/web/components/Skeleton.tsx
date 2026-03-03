interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-100 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <Skeleton className="mb-4 h-5 w-1/3" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-50 px-4 py-3 last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={`h-4 flex-1 ${j === 0 ? "w-1/4" : ""}`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

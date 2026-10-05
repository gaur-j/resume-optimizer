import { Skeleton } from "@/components/ui/skeleton";

export function ResultsPanelSkeleton() {
  return (
    <div className="w-full space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>

      <div className="space-y-3 pt-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function CreditsCardSkeleton() {
  return (
    <div className="w-full space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <Skeleton className="h-10 w-12" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

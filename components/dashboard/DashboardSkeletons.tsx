import { Skeleton } from "@/components/ui/skeleton";

export function ResultsPanelSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-6 w-full">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px] max-w-full" />
      </div>

      {/* 4 Category Score Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>

      {/* AI Bullet Point Rewrite Section */}
      <div className="space-y-4 mt-8">
        <Skeleton className="h-6 w-[150px]" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function CreditsCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 w-full">
      <Skeleton className="h-6 w-[120px]" />
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-[60px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-lg" />
    </div>
  );
}

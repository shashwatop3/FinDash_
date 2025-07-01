import { Skeleton } from "@/components/ui/skeleton";

export const ChartSkeleton = () => {
  return (
    <div className="h-[350px] w-full space-y-4 p-4">
      {/* Chart area skeleton */}
      <div className="h-64 w-full rounded-lg bg-muted/50 animate-pulse" />
      
      {/* Legend skeleton */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
};

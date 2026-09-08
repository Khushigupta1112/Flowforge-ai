import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/[0.05]",
        className,
      )}
    />
  );
}

export function SkeletonTile({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-4", className)}>
      <Skeleton className="mb-3 h-4 w-2/5" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}
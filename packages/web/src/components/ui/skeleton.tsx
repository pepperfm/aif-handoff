import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
}

const bgByIndex = [
  "bg-secondary/40",
  "bg-secondary/25",
  "bg-secondary/20",
  "bg-secondary/15",
] as const;

function bgForIndex(index: number): string {
  return bgByIndex[Math.min(index, bgByIndex.length - 1)];
}

const base = "rounded-none border border-border animate-pulse";

function Skeleton({ className, count = 1 }: SkeletonProps) {
  if (count <= 1) {
    return <div className={cn(base, "bg-secondary/25", className)} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(base, bgForIndex(i), className)} />
      ))}
    </div>
  );
}

export { Skeleton };

'use client'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-border/50 rounded-xl ${className}`} />
  )
}

export function SessionCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="w-24 h-4" />
          </div>
          <Skeleton className="w-32 h-3" />
        </div>
        <Skeleton className="w-14 h-5" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
  )
}

export function SessionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default Skeleton

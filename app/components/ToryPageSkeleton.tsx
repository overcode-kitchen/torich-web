'use client'

export default function ToryPageSkeleton() {
  return (
    <div
      className="rounded-2xl bg-surface-dark p-6 flex flex-col gap-5"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-3 w-32 rounded bg-white/15 animate-pulse" />
      <div className="flex flex-col gap-3">
        <div className="h-4 w-full rounded bg-white/15 animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-white/15 animate-pulse" />
        <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="h-9 w-28 rounded-xl bg-white/10 animate-pulse" />
    </div>
  )
}

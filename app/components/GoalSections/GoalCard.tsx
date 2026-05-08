'use client'

import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalCardProps {
  goal: Goal
  progress: GoalProgress
  onClick: () => void
}

function fmt(value: number): string {
  return value.toLocaleString('ko-KR')
}

function dDayLabel(dDay: number | null): string {
  if (dDay === null) return ''
  if (dDay > 0) return `D-${dDay}`
  if (dDay === 0) return 'D-DAY'
  return `D+${Math.abs(dDay)}`
}

export function GoalCard({ goal, progress, onClick }: GoalCardProps) {
  const isCompleted = progress.isCompleted
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-60 flex-shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{goal.emoji ?? '🎯'}</span>
        <span className="text-sm text-muted-foreground">
          {dDayLabel(progress.dDay)}
        </span>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-foreground">
        {goal.name}
      </h3>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">
          현재{' '}
          <span
            className={isCompleted ? 'text-primary' : 'text-foreground'}
          >
            {fmt(progress.currentValue)}원
          </span>
        </span>
        {progress.projectedValue !== null && (
          <span className="text-sm text-muted-foreground">
            예상 {fmt(progress.projectedValue)}원
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${
            isCompleted ? 'bg-primary' : 'bg-foreground/40'
          }`}
          style={{ width: `${Math.min(progress.progressPercent, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {progress.progressPercent}%
      </span>
    </button>
  )
}

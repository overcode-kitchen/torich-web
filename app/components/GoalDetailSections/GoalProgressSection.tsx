'use client'

import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalProgressSectionProps {
  goal: Goal
  progress: GoalProgress
}

function formatAmount(value: number): string {
  return value.toLocaleString('ko-KR')
}

function dDayLabel(dDay: number | null): string {
  if (dDay === null) return '마감일 미설정'
  if (dDay > 0) return `D-${dDay}`
  if (dDay === 0) return 'D-DAY'
  return `D+${Math.abs(dDay)}`
}

export function GoalProgressSection({ goal, progress }: GoalProgressSectionProps) {
  const isCompleted = progress.isCompleted
  const projectedCompleted =
    progress.projectedProgressPercent !== null &&
    progress.projectedProgressPercent >= 100

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border-subtle-lighter bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground-subtle">
          {dDayLabel(progress.dDay)}
        </span>
        <span className="text-xs text-foreground-subtle">
          목표 {formatAmount(goal.target_amount)}원
        </span>
      </div>

      {/* 현재값 축 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-foreground-soft">지금까지</span>
          <span
            className={`text-xl font-bold tracking-tight ${
              isCompleted ? 'text-primary' : 'text-foreground'
            }`}
          >
            {formatAmount(progress.currentValue)}원
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${
              isCompleted ? 'bg-primary' : 'bg-foreground/40'
            }`}
            style={{ width: `${Math.min(progress.progressPercent, 100)}%` }}
          />
        </div>
        <span className="text-xs text-foreground-subtle">
          {progress.progressPercent}%
        </span>
      </div>

      {/* 예상값 축 (target_date 있을 때만) */}
      {progress.projectedValue !== null &&
        progress.projectedProgressPercent !== null && (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-foreground-soft">
                그때까지 예상
              </span>
              <span
                className={`text-xl font-bold tracking-tight ${
                  projectedCompleted ? 'text-primary' : 'text-foreground-soft'
                }`}
              >
                {formatAmount(progress.projectedValue)}원
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${
                  projectedCompleted ? 'bg-primary' : 'bg-foreground/30'
                }`}
                style={{
                  width: `${Math.min(progress.projectedProgressPercent, 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-foreground-subtle">
              {progress.projectedProgressPercent}% (추정)
            </span>
          </div>
        )}

      {goal.external_amount > 0 && (
        <p className="text-xs text-foreground-subtle">
          외부 자산 {formatAmount(goal.external_amount)}원 포함
        </p>
      )}
    </div>
  )
}

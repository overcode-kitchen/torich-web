'use client'

import { formatFullDate } from '@/app/utils/date'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalProgressSectionProps {
  goal: Goal
  progress: GoalProgress
}

export function GoalProgressSection({ goal, progress }: GoalProgressSectionProps) {
  const isCompleted = progress.isCompleted
  const startDate = new Date(goal.created_at)
  const endDate = goal.target_date ? new Date(goal.target_date) : null

  return (
    <section className="py-6 border-b border-border-subtle-lighter">
      <div className="flex justify-between text-base text-muted-foreground mb-3">
        <span className="font-medium">진행률</span>
        <span className="font-bold text-foreground">
          {progress.progressPercent}%
        </span>
      </div>
      <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCompleted ? 'bg-green-500' : 'bg-brand-500'
          }`}
          style={{ width: `${Math.min(progress.progressPercent, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-foreground-subtle mt-3">
        <span>시작: {formatFullDate(startDate)}</span>
        {endDate && <span>마감: {formatFullDate(endDate)}</span>}
      </div>
    </section>
  )
}

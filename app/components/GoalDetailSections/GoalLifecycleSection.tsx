'use client'

import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalLifecycleSectionProps {
  goal: Goal
  progress: GoalProgress
}

export function GoalLifecycleSection({
  goal,
  progress,
}: GoalLifecycleSectionProps) {
  const showCelebration =
    goal.completed_at !== null && progress.isCompleted

  const isPastDue = progress.dDay !== null && progress.dDay < 0
  const showDeadlineCard =
    isPastDue && goal.archived_at === null && !progress.isCompleted

  if (!showCelebration && !showDeadlineCard) return null

  return (
    <section className="py-6 border-t border-border-subtle-lighter space-y-4">
      {showCelebration && (
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <p className="text-sm font-semibold text-primary">🎉 목표 달성!</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            잘 모으셨어요. 계속 유지할지, 삭제할지 자유롭게 선택하세요.
          </p>
        </div>
      )}

      {showDeadlineCard && (
        <div className="rounded-2xl bg-surface-hover p-5">
          <p className="text-sm text-foreground">마감일이 지났어요.</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            달성률 {progress.progressPercent}% — 삭제할지, 더 모을지 천천히
            결정해보세요.
          </p>
        </div>
      )}
    </section>
  )
}

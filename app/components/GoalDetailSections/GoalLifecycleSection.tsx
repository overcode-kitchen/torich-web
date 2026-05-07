'use client'

import { Button } from '@/components/ui/button'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalLifecycleSectionProps {
  goal: Goal
  progress: GoalProgress
  isArchiving: boolean
  onArchive: () => void
  onEdit?: () => void
}

export function GoalLifecycleSection({
  goal,
  progress,
  isArchiving,
  onArchive,
  onEdit,
}: GoalLifecycleSectionProps) {
  // 달성 축하: completed_at이 set되어 있고, 현재값도 여전히 100% 이상일 때만 표시.
  // (external_amount 변경으로 미달성으로 떨어진 경우는 표시 안 함 — Architect 권고)
  const showCelebration =
    goal.completed_at !== null && progress.isCompleted

  // 마감일 도래 + 미달성: "실패" 단어 금지, 긍정 프레이밍.
  const isPastDue = progress.dDay !== null && progress.dDay < 0
  const showDeadlineCard =
    isPastDue && goal.archived_at === null && !progress.isCompleted

  return (
    <div className="flex flex-col gap-4">
      {showCelebration && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-6">
          <p className="text-base font-semibold text-primary">🎉 목표 달성!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            잘 모으셨어요. 계속 유지할지, 정리할지 자유롭게 선택하세요.
          </p>
        </div>
      )}

      {showDeadlineCard && (
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-base text-foreground">마감일이 지났어요.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            달성률 {progress.progressPercent}% — 잘 모으셨어요. 정리할지, 더
            모을지 천천히 결정해보세요.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {onEdit && (
          <Button size="lg" variant="outline" onClick={onEdit}>
            수정하기
          </Button>
        )}
        <Button
          size="lg"
          variant="ghost"
          onClick={onArchive}
          disabled={isArchiving}
        >
          {isArchiving ? '정리 중…' : '정리하기'}
        </Button>
      </div>
    </div>
  )
}

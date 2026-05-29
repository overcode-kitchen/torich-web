'use client'

import type { GoalStepId } from '@/app/hooks/goal/add/useGoalFlow'

interface GoalFlowHeaderProps {
  currentStep: GoalStepId
}

/**
 * /goal/new 3분할 프로그레스 바 (토스 스타일).
 * 현재 단계와 그 이전 단계는 채워짐, 이후 단계는 비어 있음.
 */
export default function GoalFlowHeader({ currentStep }: GoalFlowHeaderProps) {
  const isFilled = (s: GoalStepId): boolean => {
    if (currentStep === 'A') return s === 'A'
    if (currentStep === 'B') return s === 'A' || s === 'B'
    return true
  }

  return (
    <div
      className="flex items-center gap-1.5 mb-8 w-32 mx-auto"
      role="progressbar"
      aria-label="진행 단계"
    >
      {(['A', 'B', 'C'] as GoalStepId[]).map((s) => (
        <div
          key={s}
          className={
            'h-1 flex-1 rounded-full transition-colors ' +
            (isFilled(s) ? 'bg-muted-foreground' : 'bg-muted')
          }
        />
      ))}
    </div>
  )
}

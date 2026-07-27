'use client'

import { formatCurrency } from '@/lib/utils'
import { InvestmentField } from '@/app/components/Common/InvestmentField'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalInfoSectionProps {
  goal: Goal
  progress: GoalProgress
  /** 목표 금액이 없을 때 "정하기"로 유도할 자리. 미전달 시 '미설정' 텍스트만 표시. */
  onSetTarget?: () => void
}

export function GoalInfoSection({
  goal,
  progress,
  onSetTarget,
}: GoalInfoSectionProps) {
  const hasTarget = goal.target_amount > 0
  const remaining = Math.max(0, goal.target_amount - progress.currentValue)

  // 금액 없이 만든 목적은 여기가 나중에 채우는 자리다. 안내 문구만 두면 어디서 고치는지
  // 알 수 없으므로 값 자리 자체를 수정 화면으로 가는 버튼으로 바꾼다.
  const targetValue = hasTarget ? (
    formatCurrency(goal.target_amount)
  ) : onSetTarget ? (
    <button
      type="button"
      onClick={onSetTarget}
      className="rounded-full bg-surface-hover px-3 py-1 text-sm font-medium text-foreground-soft transition-colors hover:bg-muted"
    >
      정하기
    </button>
  ) : (
    '미설정'
  )

  return (
    <section className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        목적 정보
      </h3>
      <div className="space-y-6">
        <InvestmentField label="목표 금액" value={targetValue} />

        <InvestmentField
          label="이미 모은 돈"
          value={formatCurrency(goal.external_amount)}
        />

        {hasTarget && (
          <InvestmentField
            label="남은 금액"
            value={formatCurrency(remaining)}
          />
        )}
      </div>
    </section>
  )
}

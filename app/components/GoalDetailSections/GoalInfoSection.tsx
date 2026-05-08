'use client'

import { formatCurrency } from '@/lib/utils'
import { formatFullDate } from '@/app/utils/date'
import { InvestmentField } from '@/app/components/Common/InvestmentField'
import type { Goal, GoalProgress } from '@/app/types/goal'

export interface GoalInfoSectionProps {
  goal: Goal
  progress: GoalProgress
}

export function GoalInfoSection({ goal, progress }: GoalInfoSectionProps) {
  const remaining = Math.max(0, goal.target_amount - progress.currentValue)

  return (
    <section className="py-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground mb-4">
        목적 정보
      </h3>
      <div className="space-y-6">
        <InvestmentField
          label="목표 금액"
          value={formatCurrency(goal.target_amount)}
          isEditMode={false}
        />

        <InvestmentField
          label="마감일"
          value={goal.target_date ? formatFullDate(new Date(goal.target_date)) : '없음'}
          isEditMode={false}
        />

        <InvestmentField
          label="외부 자산"
          value={formatCurrency(goal.external_amount)}
          isEditMode={false}
        />

        <div className="space-y-6">
          <div className="border-t border-border-subtle-lighter my-2" />

          <InvestmentField
            label="현재 모은 금액"
            value={formatCurrency(progress.currentValue)}
            isEditMode={false}
          />

          {progress.projectedValue !== null && (
            <InvestmentField
              label="마감일 예상 금액"
              value={formatCurrency(progress.projectedValue)}
              isEditMode={false}
            />
          )}

          <InvestmentField
            label="남은 금액"
            value={formatCurrency(remaining)}
            isEditMode={false}
          />
        </div>
      </div>
    </section>
  )
}

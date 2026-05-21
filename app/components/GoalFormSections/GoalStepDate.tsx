'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import GoalTargetDateField from './GoalTargetDateField'

interface GoalStepDateProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

/**
 * 단계 C — 언제까지 모을까요? (선택)
 * 비워두고 저장해도 무방. 마감일이 있으면 예상 금액 함께 표시.
 */
export default function GoalStepDate({
  values,
  setField,
  disabled,
}: GoalStepDateProps) {
  return (
    <div className="py-4">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
        언제까지 모을까요?
      </h2>
      <p className="text-sm text-foreground-subtle mb-4">
        마감일이 있으면 그때까지의 예상 금액도 같이 보여드려요. 건너뛰어도 괜찮아요.
      </p>
      <GoalTargetDateField
        value={values.target_date}
        onChange={(v) => setField('target_date', v)}
        disabled={disabled}
      />
    </div>
  )
}

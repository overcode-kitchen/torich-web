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
 * 단계 C — 언제까지 이룰까요? (선택)
 * 맥락화된 제목 + 비워두고 저장해도 무방. 마감일이 있으면 예상 금액 함께 표시.
 */
export default function GoalStepDate({
  values,
  setField,
  disabled,
}: GoalStepDateProps) {
  const goalName = values.name.trim()
  const title = goalName ? `${goalName}, 언제까지 이룰까요?` : '언제까지 이룰까요?'

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">
        {title}
      </h2>
      <p className="text-sm text-foreground-subtle mb-8">
        마감일이 있으면 그때까지의 예상 금액도 같이 보여드려요. 건너뛰어도 괜찮아요.
      </p>
      <GoalTargetDateField
        value={values.target_date}
        onChange={(v) => setField('target_date', v)}
        disabled={disabled}
        variant="flow"
      />
    </div>
  )
}

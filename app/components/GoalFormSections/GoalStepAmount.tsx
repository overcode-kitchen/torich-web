'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import GoalAmountField from './fields/GoalAmountField'

interface GoalStepAmountProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

/**
 * 단계 B — 얼마나 모을까요?
 * 맥락화된 제목 + 공용 GoalAmountField(대형) + ±빠른 조정.
 */
export default function GoalStepAmount({
  values,
  setField,
  disabled,
}: GoalStepAmountProps) {
  const goalName = values.name.trim()
  const title = goalName ? `${goalName}, 얼마나 모을까요?` : '얼마나 모을까요?'

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-10">
        {title}
      </h2>
      <GoalAmountField
        id="goal-target"
        size="lg"
        value={values.target_amount}
        onChange={(won) => setField('target_amount', won)}
        disabled={disabled}
      />
    </div>
  )
}

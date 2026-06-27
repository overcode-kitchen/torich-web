'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import GoalDateField from './fields/GoalDateField'
import GoalOptionalFields from './fields/GoalOptionalFields'
import { GOAL_DEADLINE_HELP } from '@/app/utils/goal-amount'

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
 * 맥락화된 제목 + 공용 GoalDateField(flow). 헬프텍스트는 제목 아래에서 안내.
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
      <p className="text-sm text-foreground-subtle mb-8">{GOAL_DEADLINE_HELP}</p>
      <GoalDateField
        value={values.target_date}
        onChange={(v) => setField('target_date', v)}
        disabled={disabled}
        variant="flow"
        showHelp={false}
      />

      <div className="mt-10 border-t border-border-subtle pt-8">
        <GoalOptionalFields
          values={values}
          setField={setField}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

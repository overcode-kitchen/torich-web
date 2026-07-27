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
 *
 * 금액은 선택이다. 얼마가 필요한지 모른 채 시작하는 목적이 많아서, 비워두면 하단 CTA가
 * "건너뛰기"로 바뀐다. 버튼만으로는 눈에 안 들어오므로 제목 아래에서 한 번 더 말해준다.
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
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">
        {title}
      </h2>
      <p className="mb-10 text-sm text-foreground-muted">
        아직 모르겠으면 비워두고 넘어가도 돼요. 나중에 목적 정보에서 정할 수 있어요.
      </p>
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

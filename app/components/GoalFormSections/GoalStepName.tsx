'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import GoalNameField from './fields/GoalNameField'

interface GoalStepNameProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

/**
 * 단계 A — 어떤 목적을 만들까요?
 * 공용 GoalNameField(아이콘 슬롯 + 이름 + 프리셋 칩)를 위저드 제목과 함께 노출.
 */
export default function GoalStepName({
  values,
  setField,
  disabled,
}: GoalStepNameProps) {
  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-8">
        어떤 목적을 만들까요?
      </h2>
      <GoalNameField values={values} setField={setField} disabled={disabled} />
    </div>
  )
}

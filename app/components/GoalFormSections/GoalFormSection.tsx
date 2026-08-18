'use client'

import { useEffect } from 'react'
import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { Label } from '@/components/ui/label'
import GoalNameField from './fields/GoalNameField'
import GoalAmountField from './fields/GoalAmountField'
import GoalDateField from './fields/GoalDateField'
import GoalOptionalFields from './fields/GoalOptionalFields'

export interface GoalFormSectionProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
  /**
   * 메모·이미 모은 돈·마감일 알림 노출 여부. 이 폼은 수정 전용이라 기본 true다.
   * (추가 위저드는 이 필드들을 일부러 묻지 않는다 — GoalOptionalFields 주석 참고.)
   */
  showOptionalFields?: boolean
  /**
   * `?field=`로 진입했을 때 열자마자 데려갈 칸 (FIELD_TO_INPUT_ID의 키).
   * 상세 정보 행을 탭해 들어오면 이 폼은 한 페이지라 그 칸이 화면 아래에 있는데,
   * 맨 위에 떨궈두면 뭘 고치러 왔는지 사용자가 다시 찾아야 한다.
   */
  focusField?: string | null
}

/**
 * `?field=` 키 → 그 칸의 input id. 상세 정보 행이 보내는 키만 여기 있다.
 * 새 행을 탭 가능하게 만들 때 이 표에 한 줄 추가하면 스크롤·포커스가 따라온다.
 * (이름은 `goal-name`, 메모는 `goal-memo`로 이미 id가 있으니 필요해지면 그대로 쓴다.)
 */
const FIELD_TO_INPUT_ID: Record<string, string> = {
  target_amount: 'goal-target',
  external_amount: 'goal-external',
}

/**
 * 목적 수정용 단일 폼. 이름·금액·마감일은 추가 위저드와 같은 공용 필드를 쓰고
 * 화면 구조만 다르다 — 값을 이미 아는 사람에게 3단계를 다시 걷게 하지 않는다.
 * 메모·이미 모은 돈·마감일 알림은 수정에서만 묻는다(GoalOptionalFields 주석 참고).
 */
export function GoalFormSection({
  values,
  setField,
  disabled,
  showOptionalFields = true,
  focusField,
}: GoalFormSectionProps) {
  useEffect(() => {
    const inputId = focusField ? FIELD_TO_INPUT_ID[focusField] : undefined
    // 접힌 칸(showOptionalFields=false)으로 오면 그릴 대상이 없으니 그냥 맨 위에 둔다.
    const input = inputId ? document.getElementById(inputId) : null
    if (!input) return
    input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 포커스는 스크롤을 다시 튀게 하지 않도록 preventScroll로 준다.
    input.focus({ preventScroll: true })
  }, [focusField])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Label htmlFor="goal-name">목적 이름</Label>
        <GoalNameField values={values} setField={setField} disabled={disabled} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-target">목표 금액</Label>
        <GoalAmountField
          id="goal-target"
          value={values.target_amount}
          onChange={(won) => setField('target_amount', won)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-date">마감일 (선택)</Label>
        <GoalDateField
          value={values.target_date}
          onChange={(v) => setField('target_date', v)}
          disabled={disabled}
        />
      </div>

      {showOptionalFields && (
        <GoalOptionalFields values={values} setField={setField} disabled={disabled} />
      )}
    </div>
  )
}

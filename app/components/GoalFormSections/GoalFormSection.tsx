'use client'

import { useEffect, useRef } from 'react'
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
  /** 이모지·메모·마감일 알림 같은 보조 필드 노출 여부. 신규 생성 시 false. */
  showOptionalFields?: boolean
  /**
   * `?field=`로 진입했을 때 열자마자 데려갈 칸. 지금은 `target_amount`만 쓴다.
   * 상세의 "정하기"로 들어오면 이 폼은 한 페이지라 금액칸이 접힌 화면 아래에 있는데,
   * 맨 위에 떨궈두면 뭘 고치러 왔는지 사용자가 다시 찾아야 한다.
   */
  focusField?: string | null
}

/**
 * 목적 수정용 단일 폼. 이름·금액·마감일은 추가 위저드와 동일한 공용 필드를 사용하고,
 * 메모·이미 모은 돈·마감일 알림은 수정 화면에서만 노출한다.
 */
export function GoalFormSection({
  values,
  setField,
  disabled,
  showOptionalFields = true,
  focusField,
}: GoalFormSectionProps) {
  const amountBlockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusField !== 'target_amount') return
    amountBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // 포커스는 스크롤을 다시 튀게 하지 않도록 preventScroll로 준다.
    document.getElementById('goal-target')?.focus({ preventScroll: true })
  }, [focusField])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Label htmlFor="goal-name">목적 이름</Label>
        <GoalNameField values={values} setField={setField} disabled={disabled} />
      </div>

      <div ref={amountBlockRef} className="flex flex-col gap-2 scroll-mt-6">
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

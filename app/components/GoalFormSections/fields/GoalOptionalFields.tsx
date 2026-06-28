'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import GoalAmountField from './GoalAmountField'

interface GoalOptionalFieldsProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

/**
 * 목적의 선택 입력(메모·이미 모은 돈·마감일 알림) 공용 필드.
 * 추가 마지막 단계와 수정 폼이 동일하게 사용한다.
 */
export default function GoalOptionalFields({
  values,
  setField,
  disabled,
}: GoalOptionalFieldsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-memo">메모 (선택)</Label>
        <Textarea
          id="goal-memo"
          placeholder="이 목적에 대한 메모"
          rows={3}
          value={values.memo}
          onChange={(e) => setField('memo', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-external">이미 모은 돈 (선택)</Label>
        <GoalAmountField
          id="goal-external"
          value={values.external_amount}
          onChange={(won) => setField('external_amount', won)}
          disabled={disabled}
          showQuickAdjust={false}
        />
        <p className="text-xs text-foreground-subtle">
          청약통장·예적금 등 토리치 밖에서 이미 모아둔 금액. 필요할 때 직접 갱신해요.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="goal-noti">마감일 알림</Label>
          <span className="text-xs text-foreground-subtle">
            일주일 전·하루 전·당일에 알려드려요.
          </span>
        </div>
        <Switch
          id="goal-noti"
          checked={values.notification_enabled}
          onCheckedChange={(checked) => setField('notification_enabled', checked)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

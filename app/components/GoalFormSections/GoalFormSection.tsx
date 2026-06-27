'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import GoalNameField from './fields/GoalNameField'
import GoalAmountField from './fields/GoalAmountField'
import GoalDateField from './fields/GoalDateField'

export interface GoalFormSectionProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
  /** 이모지·메모·마감일 알림 같은 보조 필드 노출 여부. 신규 생성 시 false. */
  showOptionalFields?: boolean
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
}: GoalFormSectionProps) {
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
      )}

      {showOptionalFields && (
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
      )}

      {showOptionalFields && (
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
      )}
    </div>
  )
}

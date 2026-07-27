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
 * 목적의 선택 입력(메모·이미 모은 돈·마감일 알림). **수정 폼 전용이다.**
 *
 * 추가 위저드에는 의도적으로 넣지 않는다. 목적을 만드는 데 꼭 필요한 값이 아닌데
 * 만들기 흐름에서 물으면, 답할 필요 없는 칸 앞에서 사용자가 멈추고 이탈한다.
 * 만든 뒤 채우면 되는 값이므로 수정 화면에만 둔다. (#70에서 재확인한 결정 —
 * "추가에 없어서 불일치"로 보고 넣으려 하기 전에 docs/ux-consistency-audit.md P2-5를 읽자.)
 */
export default function GoalOptionalFields({
  values,
  setField,
  disabled,
}: GoalOptionalFieldsProps) {
  // 마감일이 없으면 알릴 날도 없다. 스케줄러가 target_date 있는 목적만 집어가므로
  // (supabase/functions/schedule-goal-notifications) 여기서 켜도 아무 일이 없는
  // 스위치가 된다. 마감일을 건너뛰고 온 사람에게는 아예 묻지 않는다.
  const hasDeadline = values.target_date.trim().length > 0

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

      {hasDeadline && (
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
            onCheckedChange={(checked) =>
              setField('notification_enabled', checked)
            }
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}

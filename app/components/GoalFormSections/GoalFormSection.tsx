'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export interface GoalFormSectionProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

const onlyDigits = (raw: string): string => raw.replace(/[^\d]/g, '')

const inputClass =
  'h-12 w-full rounded-xl border border-input bg-card px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

const textareaClass =
  'w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

export function GoalFormSection({
  values,
  setField,
  disabled,
}: GoalFormSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-name">목적 이름</Label>
        <input
          id="goal-name"
          className={inputClass}
          placeholder="예: 결혼자금"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-target">목표 금액 (원)</Label>
        <input
          id="goal-target"
          className={inputClass}
          inputMode="numeric"
          placeholder="예: 50000000"
          value={values.target_amount}
          onChange={(e) => setField('target_amount', onlyDigits(e.target.value))}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-date">마감일 (선택)</Label>
        <input
          id="goal-date"
          className={inputClass}
          type="date"
          value={values.target_date}
          onChange={(e) => setField('target_date', e.target.value)}
          disabled={disabled}
        />
        <p className="text-sm text-muted-foreground">
          마감일이 있으면 그때까지의 예상 금액도 같이 보여드려요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-emoji">이모지 (선택)</Label>
        <input
          id="goal-emoji"
          className={inputClass}
          placeholder="예: 💍"
          maxLength={4}
          value={values.emoji}
          onChange={(e) => setField('emoji', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-memo">메모 (선택)</Label>
        <textarea
          id="goal-memo"
          className={textareaClass}
          placeholder="이 목적에 대한 메모"
          rows={3}
          value={values.memo}
          onChange={(e) => setField('memo', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-external">이미 모아둔 외부 자산 (원, 선택)</Label>
        <input
          id="goal-external"
          className={inputClass}
          inputMode="numeric"
          value={values.external_amount}
          onChange={(e) =>
            setField('external_amount', onlyDigits(e.target.value))
          }
          disabled={disabled}
        />
        <p className="text-sm text-muted-foreground">
          청약통장·예적금 등 토리치 밖에서 모은 금액. 필요할 때 직접 갱신해요.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="goal-noti">마감일 알림</Label>
          <span className="text-sm text-muted-foreground">
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

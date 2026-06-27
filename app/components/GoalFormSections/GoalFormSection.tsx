'use client'

import Image from 'next/image'
import {
  GOAL_PRESETS,
  resolvePurposeIcon,
  type GoalPreset,
} from '@/app/constants/goal'
import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import DateSelectField from '@/app/components/Common/DateSelectField'
import PurposeIconSlot from './PurposeIconSlot'

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

const onlyDigits = (raw: string): string => raw.replace(/[^\d]/g, '')

/** 원(won) 정수 문자열 → 만원 정수 문자열 (콤마 포함) */
const wonToManwonDisplay = (won: string): string => {
  if (!won) return ''
  const manwon = Math.floor(Number(won) / 10000)
  return manwon.toLocaleString('ko-KR')
}

/** 사용자가 만원 단위로 입력한 값 → 원(won) 문자열 */
const manwonInputToWon = (input: string): string => {
  const digits = onlyDigits(input)
  if (!digits) return ''
  return String(Number(digits) * 10000)
}

/** 현재 원(won) 값에서 만원 단위로 ±delta 적용 (음수 방지) */
const adjustWonByManwon = (won: string, deltaManwon: number): string => {
  const baseManwon = won ? Math.floor(Number(won) / 10000) : 0
  const next = Math.max(0, baseManwon + deltaManwon)
  return String(next * 10000)
}

const TARGET_QUICK_ADJUSTS: { label: string; delta: number }[] = [
  { label: '+1,000만', delta: 1000 },
  { label: '-1,000만', delta: -1000 },
  { label: '+100만', delta: 100 },
  { label: '-100만', delta: -100 },
]

export function GoalFormSection({
  values,
  setField,
  disabled,
  showOptionalFields = true,
}: GoalFormSectionProps) {
  function applyPreset(preset: GoalPreset): void {
    setField('name', preset.name)
    setField('emoji', preset.iconKey)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Label htmlFor="goal-name">목적 이름</Label>
        <PurposeIconSlot
          value={values.emoji}
          onChange={(iconKey) => setField('emoji', iconKey)}
          disabled={disabled}
        />
        <Input
          id="goal-name"
          placeholder="예: 결혼자금"
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          disabled={disabled}
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {GOAL_PRESETS.map((preset) => {
            const isActive = values.name.trim() === preset.name
            const icon = resolvePurposeIcon(preset.iconKey)
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                disabled={disabled}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                  isActive
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border-subtle-lighter bg-card text-foreground-soft hover:bg-muted',
                )}
              >
                {icon && (
                  <Image
                    src={icon.src}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                  />
                )}
                <span>{preset.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-target">목표 금액</Label>
        <div className="relative">
          <Input
            id="goal-target"
            className="pr-14"
            inputMode="numeric"
            placeholder="예: 5,000"
            value={wonToManwonDisplay(values.target_amount)}
            onChange={(e) =>
              setField('target_amount', manwonInputToWon(e.target.value))
            }
            disabled={disabled}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground-soft">
            만원
          </span>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {TARGET_QUICK_ADJUSTS.map(({ label, delta }) => (
            <button
              key={label}
              type="button"
              onClick={() =>
                setField(
                  'target_amount',
                  adjustWonByManwon(values.target_amount, delta),
                )
              }
              disabled={disabled}
              className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-date">마감일 (선택)</Label>
        <DateSelectField
          value={values.target_date}
          onChange={(v) => setField('target_date', v)}
          disabled={disabled}
          placeholder="마감일 선택"
          clearable
          emptyLabel="마감일 없음"
        />
        <p className="text-xs text-foreground-subtle">
          마감일이 있으면 그때까지의 예상 금액도 같이 보여드려요.
        </p>
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
          <div className="relative">
            <Input
              id="goal-external"
              className="pr-14"
              inputMode="numeric"
              value={wonToManwonDisplay(values.external_amount)}
              onChange={(e) =>
                setField('external_amount', manwonInputToWon(e.target.value))
              }
              disabled={disabled}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-foreground-soft">
              만원
            </span>
          </div>
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

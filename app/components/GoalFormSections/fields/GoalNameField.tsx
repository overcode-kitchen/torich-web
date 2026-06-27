'use client'

import Image from 'next/image'
import {
  GOAL_PRESETS,
  resolvePurposeIcon,
  type GoalPreset,
} from '@/app/constants/goal'
import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { FlowInput } from '@/app/components/Common/FlowInput'
import { cn } from '@/lib/utils'
import PurposeIconSlot from '../PurposeIconSlot'

interface GoalNameFieldProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

/**
 * 목적 이름 입력 공용 필드 — 추가 위저드/수정 폼이 동일하게 사용.
 * 3D 아이콘 슬롯 + 이름 입력(FlowInput) + 프리셋 칩(이름·아이콘 동시 적용).
 */
export default function GoalNameField({
  values,
  setField,
  disabled,
}: GoalNameFieldProps) {
  function applyPreset(preset: GoalPreset): void {
    setField('name', preset.name)
    setField('emoji', preset.iconKey)
  }

  return (
    <div className="flex flex-col gap-5">
      <PurposeIconSlot
        value={values.emoji}
        onChange={(iconKey) => setField('emoji', iconKey)}
        disabled={disabled}
      />

      <FlowInput
        id="goal-name"
        placeholder="예: 결혼자금"
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        disabled={disabled}
      />

      <div className="grid grid-cols-5 gap-2">
        {GOAL_PRESETS.map((preset) => {
          const isActive = values.name.trim() === preset.name
          const icon = resolvePurposeIcon(preset.iconKey)
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              disabled={disabled}
              className="flex flex-col items-center gap-2 transition-opacity disabled:opacity-50"
            >
              <span
                className={cn(
                  'flex aspect-[4/5] w-full items-center justify-center rounded-full bg-muted/40 transition-colors',
                  isActive &&
                    'ring-2 ring-foreground ring-offset-2 ring-offset-background',
                )}
              >
                {icon && (
                  <Image
                    src={icon.src}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                )}
              </span>
              <span
                className={cn(
                  'truncate text-xs',
                  isActive
                    ? 'font-semibold text-foreground'
                    : 'font-medium text-foreground-soft',
                )}
              >
                {preset.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

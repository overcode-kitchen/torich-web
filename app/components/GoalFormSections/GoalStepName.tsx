'use client'

import Image from 'next/image'
import {
  GOAL_PRESETS,
  resolvePurposeIcon,
  type GoalPreset,
} from '@/app/constants/goal'
import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import PurposeIconSlot from './PurposeIconSlot'

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
 * 3D 아이콘 슬롯 + 이름 입력 + 프리셋 칩(이름·아이콘 동시 적용).
 */
export default function GoalStepName({
  values,
  setField,
  disabled,
}: GoalStepNameProps) {
  function applyPreset(preset: GoalPreset): void {
    setField('name', preset.name)
    setField('emoji', preset.iconKey)
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        어떤 목적을 만들까요?
      </h2>

      <div className="mb-6">
        <PurposeIconSlot
          value={values.emoji}
          onChange={(iconKey) => setField('emoji', iconKey)}
          disabled={disabled}
        />
      </div>

      <Input
        id="goal-name"
        placeholder="예: 결혼자금"
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        disabled={disabled}
      />
      <div className="grid grid-cols-5 gap-2 pt-6">
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
                  isActive && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
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

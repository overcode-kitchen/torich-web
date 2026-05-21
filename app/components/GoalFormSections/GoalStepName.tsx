'use client'

import { GOAL_PRESETS, type GoalPreset } from '@/app/constants/goal'
import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { cn } from '@/lib/utils'

interface GoalStepNameProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

const inputClass =
  'h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

/**
 * 단계 A — 어떤 목적을 만들까요?
 * 이름 입력 + 프리셋 칩(이모지·이름 동시 적용).
 */
export default function GoalStepName({
  values,
  setField,
  disabled,
}: GoalStepNameProps) {
  function applyPreset(preset: GoalPreset): void {
    setField('name', preset.name)
    setField('emoji', preset.emoji)
  }

  return (
    <div className="py-4">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        어떤 목적을 만들까요?
      </h2>
      <input
        id="goal-name"
        className={inputClass}
        placeholder="예: 결혼자금"
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        disabled={disabled}
      />
      <div className="flex flex-wrap gap-2 pt-3">
        {GOAL_PRESETS.map((preset) => {
          const isActive = values.name.trim() === preset.name
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              disabled={disabled}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                isActive
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border-subtle-lighter bg-card text-foreground-soft hover:bg-muted',
              )}
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

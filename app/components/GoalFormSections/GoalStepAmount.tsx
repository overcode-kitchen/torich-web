'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { cn } from '@/lib/utils'

interface GoalStepAmountProps {
  values: GoalFormValues
  setField: <K extends keyof GoalFormValues>(
    key: K,
    value: GoalFormValues[K],
  ) => void
  disabled?: boolean
}

const onlyDigits = (raw: string): string => raw.replace(/[^\d]/g, '')

const wonToManwonDisplay = (won: string): string => {
  if (!won) return ''
  const manwon = Math.floor(Number(won) / 10000)
  return manwon.toLocaleString('ko-KR')
}

const manwonInputToWon = (input: string): string => {
  const digits = onlyDigits(input)
  if (!digits) return ''
  return String(Number(digits) * 10000)
}

const adjustWonByManwon = (won: string, deltaManwon: number): string => {
  const baseManwon = won ? Math.floor(Number(won) / 10000) : 0
  const next = Math.max(0, baseManwon + deltaManwon)
  return String(next * 10000)
}

const inputClass =
  'h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

const TARGET_QUICK_ADJUSTS: { label: string; delta: number }[] = [
  { label: '+1,000만', delta: 1000 },
  { label: '-1,000만', delta: -1000 },
  { label: '+100만', delta: 100 },
  { label: '-100만', delta: -100 },
]

/**
 * 단계 B — 얼마를 모으려고 하나요?
 * 만원 단위 입력 + ±100만/±1,000만 빠른 조정.
 */
export default function GoalStepAmount({
  values,
  setField,
  disabled,
}: GoalStepAmountProps) {
  return (
    <div className="py-4">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">
        얼마를 모으려고 하나요?
      </h2>
      <div className="relative">
        <input
          id="goal-target"
          className={cn(inputClass, 'pr-14')}
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
      <div className="flex flex-wrap justify-end gap-2 mt-3">
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
  )
}

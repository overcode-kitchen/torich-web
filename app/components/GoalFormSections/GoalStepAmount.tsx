'use client'

import type { GoalFormValues } from '@/app/hooks/goal/add/useGoalForm'
import { FlowInput } from '@/app/components/Common/FlowInput'

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

const TARGET_QUICK_ADJUSTS: { label: string; delta: number }[] = [
  { label: '+1,000만', delta: 1000 },
  { label: '-1,000만', delta: -1000 },
  { label: '+100만', delta: 100 },
  { label: '-100만', delta: -100 },
]

/**
 * 단계 B — 얼마나 모을까요?
 * 맥락화된 제목 + 대형 금액 입력 + ±100만/±1,000만 빠른 조정.
 */
export default function GoalStepAmount({
  values,
  setField,
  disabled,
}: GoalStepAmountProps) {
  const goalName = values.name.trim()
  const title = goalName ? `${goalName}, 얼마나 모을까요?` : '얼마나 모을까요?'

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-10">
        {title}
      </h2>
      <FlowInput
        id="goal-target"
        size="lg"
        suffix="만원"
        inputMode="numeric"
        placeholder="0"
        value={wonToManwonDisplay(values.target_amount)}
        onChange={(e) =>
          setField('target_amount', manwonInputToWon(e.target.value))
        }
        disabled={disabled}
      />
      <div className="flex flex-wrap justify-end gap-2 mt-4">
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

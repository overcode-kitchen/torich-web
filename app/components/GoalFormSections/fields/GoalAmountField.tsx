'use client'

import { FlowInput } from '@/app/components/Common/FlowInput'
import {
  wonToManwonDisplay,
  manwonInputToWon,
  adjustWonByManwon,
  TARGET_QUICK_ADJUSTS,
} from '@/app/utils/goal-amount'

interface GoalAmountFieldProps {
  id?: string
  /** 원(won) 단위 문자열 */
  value: string
  /** 원(won) 단위 문자열로 변경값 전달 */
  onChange: (won: string) => void
  disabled?: boolean
  /** 'lg' 히어로 표시(추가 위저드) | 'md' 일반(수정 폼) */
  size?: 'md' | 'lg'
  placeholder?: string
  /** ±100만/±1,000만 빠른 조정 칩 노출 여부 */
  showQuickAdjust?: boolean
}

/**
 * 목적 금액 입력 공용 필드 — 만원 단위 입력, 원 단위로 콜백.
 * 추가 위저드(목표 금액, size=lg)와 수정 폼(목표 금액·이미 모은 돈)이 공유.
 */
export default function GoalAmountField({
  id,
  value,
  onChange,
  disabled,
  size = 'md',
  placeholder = '0',
  showQuickAdjust = true,
}: GoalAmountFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <FlowInput
        id={id}
        size={size}
        suffix="만원"
        inputMode="numeric"
        placeholder={placeholder}
        value={wonToManwonDisplay(value)}
        onChange={(e) => onChange(manwonInputToWon(e.target.value))}
        disabled={disabled}
      />
      {showQuickAdjust && (
        <div className="flex flex-wrap justify-end gap-2">
          {TARGET_QUICK_ADJUSTS.map(({ label, delta }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange(adjustWonByManwon(value, delta))}
              disabled={disabled}
              className="rounded-full bg-surface-hover hover:bg-muted text-foreground-soft font-medium text-xs px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
